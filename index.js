/**
 * ECC helper bot
 * 
 * Friendly helper for the ECC Discord, Slack, and Telegram servers
 * 
 * @author Troy McCabe <troymccabe@gmail.com>
 */

var http = require('http');
var https = require('https');

var DISCORD_CHANNELS = {};
var DISCORD_CLIENT;
var SLACK_CHANNELS = {};
var SLACK_CLIENT;
var TELEGRAM_CLIENT;
const SOURCE_DISCORD = 'discord';
const SOURCE_SLACK = 'slack';
const SOURCE_TELEGRAM = 'telegram';
const TOKEN_DISCORD = process.env.ECC_BOT_DISCORD_TOKEN;
const TOKEN_SLACK = process.env.ECC_BOT_SLACK_TOKEN;
const TOKEN_TELEGRAM = process.env.ECC_BOT_TELEGRAM_TOKEN;

function cleanChannelName(channel) {
    return channel.toLowerCase().replace(/( |-)/, '_');
}

function processMessage(message, source) {
    if (!message) {
        return new Promise((resolve, reject) => {});
    }
    
    if (message.match(/wh?en (moon|lambo)/igm)) {
        switch (source) {
            case SOURCE_DISCORD:
                return 'How should I know? Go ask in <#409184678730268672>';

            case SOURCE_SLACK:
                return 'Check with #price-prediction on Discord: https://discord.gg/X2XVaQz';

            case SOURCE_TELEGRAM:
                return 'After hard work!';
        }
    }

    if (message.match(/\?help/igm)) {
        return (
            'I can provide information on the following topics (use the `?***` command to see details):\r\n\r\n' +
            '`?wiki`: Get the link to the wiki\r\n' + 
            '`?wiki.backup`: Get the link to the backup process wiki article\r\n' + 
            '`?wiki.faq`: Get the link to the FAQ wiki article\r\n' + 
            '`?wiki.installation`: Get the link to the installation wiki article\r\n' + 
            '`?wiki.staking`: Get the link to the staking wiki article\r\n' +
            '`addr(ECC_ADDRESS)`: Shows the date first seen on the network, as well as the current balance\r\n' +
            '`tx(TXID)`: Shows detail for a specific transaction'
        );
    }

    if (message.match(/\?wiki(?!\.)/igm)) {
        return 'https://github.com/project-ecc/ECC-Wiki/wiki';
    }

    if (message.match(/\?wiki\.backup/igm)) {
        return 'https://github.com/project-ecc/ECC-Wiki/wiki/Backup-process';
    }

    if (message.match(/\?wiki\.faq/igm)) {
        return 'https://github.com/project-ecc/ECC-Wiki/wiki/FAQ';
    }

    if (message.match(/\?wiki\.installation/igm)) {
        return 'https://github.com/project-ecc/ECC-Wiki/wiki/Installation';
    }

    if (message.match(/\?wiki\.staking/igm)) {
        return 'https://github.com/project-ecc/ECC-Wiki/wiki/How-to-stake';
    }

    var matches = message.match(/addr\((\w+)\)/i);
    if (matches && matches.length > 1) {
        return require('./lib/addr.js')(matches[1]);
    }

    var matches = message.match(/tx\((\w+)\)/i);
    if (matches && matches.length > 1) {
        return require('./lib/tx.js')(matches[1]);
    }

    return;
}

/*
 * DISCORD
 */
if (TOKEN_DISCORD) {
    const Discord = require("discord.js");

    var discordClient = new Discord.Client();
    discordClient.on('ready', () => {});
    discordClient.on('message', message => {
        // ignore messages from myself or other bots
        if (message.author.bot) {
            return;
        }

        var response = processMessage(message.content, SOURCE_DISCORD);
        if (response) {
            if (typeof response == 'string') {
                message.channel.send(response).catch(reason => {});
            } else if (response instanceof Promise) {
                response.then((val) => {message.channel.send(val).catch(reason => {});});
            }
            
        }
    });

    discordClient.login(TOKEN_DISCORD)
        .then(() => {
            discordClient.channels.map((channel) => {
                DISCORD_CHANNELS[cleanChannelName(channel.name)] = channel;
            });
        });
}

/*
 * SLACK
 */
if (TOKEN_SLACK) {
    const { RtmClient, WebClient, CLIENT_EVENTS, RTM_EVENTS } = require('@slack/client');

    const appData = {};
    var slackClient = new RtmClient(TOKEN_SLACK, {dataStore: false, useRtmConnect: true,});

    slackClient.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (connectData) => {
        appData.selfId = connectData.self.id;
    });

    slackClient.on(RTM_EVENTS.MESSAGE, (message) => {
        // ignore messages from myself or other bots
        if (
            (message.subtype && message.subtype === 'bot_message') || 
            (!message.subtype && message.user === appData.selfId)
        ) {
            return;
        }

        var response = processMessage(message.text, SOURCE_SLACK);
        if (response) {
            if (typeof response == 'string') {
                slackClient.sendMessage(response, message.channel);
            } else if (response instanceof Promise) {
                response.then((val) => {slackClient.sendMessage(val, message.channel);});
            }
        }
    });

    slackClient.start();

    // grab public channels
    new WebClient(TOKEN_SLACK)
        .channels
        .list()
        .then((result) => {
            result.channels.forEach(channel => {
                SLACK_CHANNELS[cleanChannelName(channel.name)] = channel;
            });
        })
        .catch(console.error);

    // grab private channels
    https.get(`https://slack.com/api/groups.list?token=${TOKEN_SLACK}`, res => {
        var body = '';
        res.on('data', data => { body += data; });
        res.on('end', () => {
            try {
                var json = JSON.parse(body);
                json.groups.forEach(channel => {
                    SLACK_CHANNELS[cleanChannelName(channel.name)] = channel;
                });
            } catch (err) {
                console.error(err);
            }
        });
    });
}

/*
 * TELEGRAM
 */
if (TOKEN_TELEGRAM) {
    const TelegramBot = require('node-telegram-bot-api');
    var telegramBot = new TelegramBot(TOKEN_TELEGRAM, {polling: {interval: 0, params: {timeout: 200}}});

    telegramBot.on('message', (message) => {
        console.log(message.chat.id);
        var response = processMessage(message.text, SOURCE_TELEGRAM);

        if (typeof response == 'string') {
            telegramBot.sendMessage(message.chat.id, response, {parse_mode: 'Markdown'});
        } else if (response instanceof Promise) {
            response.then((val) => {telegramBot.sendMessage(message.chat.id, val, {parse_mode: 'Markdown'});});
        }
    });

    telegramBot.on('new_chat_members', (message) => {
        var addressTo = '';
        if (message.new_chat_members && message.new_chat_members.length) {
            message.new_chat_members.map((user) => {
                if (user.username) {
                    addressTo += `@${user.username}, `
                } else {
                    addressTo += `${user.first_name}, `
                }
            });
        }
        telegramBot.sendMessage(
            message.chat.id, 
            `Welcome ${addressTo.replace(/, /, '')} to the ECC Family. Please take a seat, and read the rules in channel information.\n\n 👉 New to ECC? Take a couple minutes to see our presentation video 👈 https://youtu.be/9yesyhkl6gI`, 
            {parse_mode: 'Markdown'}
        );
    })
}

/*
 * Voting 
 */
function remindAboutExchangeVotes(service) {
    var voteMessage = 'Don\'t forget to vote for ECC to get listed on new exchanges!\r\n\r\n' +
        'We\'re currently in the running for:\r\n' +
        'COBINHOOD: https://cobinhood.canny.io/token-listing/p/ecc-coin-listing\r\n' +
        'NEXT.exchange: https://nextexchange.featureupvote.com/suggestions/4595/please-add-ecc-coin\r\n' +
        'CoinFalcon: https://feedback.coinfalcon.com/coin-request/p/ecc\r\n' +
        'Lescovex: https://lescovex.featureupvote.com/suggestions/6241/ecc-coin-blockchain-services-for-the-masses\r\n\r\n' +
        '_Please make sure to follow the rules for each site_';
    if (discordClient && DISCORD_CHANNELS.ecc && service == 'discord') {
        DISCORD_CHANNELS.ecc.send(voteMessage).catch((err) => {console.error(err);});
    }
    if (slackClient && SLACK_CHANNELS.ecc && service == 'slack') {
        slackClient.sendMessage(voteMessage, SLACK_CHANNELS.ecc.id);
    }
    if (telegramBot && service == 'telegram') {
        telegramBot.sendMessage(-1001313163406,  voteMessage, {parse_mode: 'Markdown'});
    }
};

/* millis * seconds * minutes * hours = xxhr interval */
/* millis * seconds * minutes * 24 hours * days = day interval */
// setInterval(function() {remindAboutExchangeVotes('discord')}, 1000 * 60 * 60 * 24 * 7);
// setInterval(function() {remindAboutExchangeVotes('slack')}, 1000 * 60 * 60 * 24);
// setInterval(function() {remindAboutExchangeVotes('telegram')}, 1000 * 60 * 60 * 24);

/*
 * Thunderclap
 */
// setInterval(function() {
//     var thunderclapMessage = 'Help us get the word out! Sign up to be part of the Thunderclap to tell the world about Sapphire, ANS, and why ECC is the future! https://www.thunderclap.it/projects/69339-the-new-era-of-ecc'
//     if (discordClient && DISCORD_CHANNELS.ecc) {
//         DISCORD_CHANNELS.ecc.send(thunderclapMessage).catch((err) => {console.error(err);});
//     }
//     if (slackClient && SLACK_CHANNELS.ecc) {
//         slackClient.sendMessage(thunderclapMessage, SLACK_CHANNELS.ecc.id);
//     }
//     if (telegramBot) {
//         telegramBot.sendMessage(-1001313163406,  thunderclapMessage, {parse_mode: 'Markdown'});
//     }
// }, 1000 * 60 * 60 * 3);

/* 
 * Incoming message handling
 */
http
    .createServer((req, res) => {
        if (req.method == 'POST' && req.headers['content-type'] == 'application/json') {
            var body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                try {
                    var json = JSON.parse(body);
                    if (json.channels && json.channels.slack && json.channels.slack.length > 0 && slackClient) {
                        json.channels.slack.forEach((channel) => {
                            if (SLACK_CHANNELS[cleanChannelName(channel)]) {
                                slackClient.sendMessage(json.message, SLACK_CHANNELS[cleanChannelName(channel)].id);
                            }
                        });
                    }
                    res.end('{"success":true}');
                } catch (err) {
                    console.error(err);
                    res.end('{"success":false,"message":"Server error"}');
                }
            });
        } else {
            res.end('{"success":false,"message":"Nah"}');
        }
    })
    .listen(33788);