/**
 * ECC helper bot
 * 
 * Friendly helper for the ECC Discord, Slack, and Telegram servers
 * 
 * @author Troy McCabe <troymccabe@gmail.com>
 */


/**
 * Imports and requirements
 */

import Wallet from './util/wallet';
import {processMessage} from "./util/messagehandler";
import {cleanChannelName} from "./util/helperfunctions";
let cleanup = require('./util/cleanup').Cleanup(cleanupFunction);
let http = require('http');
let https = require('https');

/**
 * Objects
 *
 * @type {{}}
 */

let DISCORD_CHANNELS = {};
let DISCORD_CLIENT;
let SLACK_CHANNELS = {};
let SLACK_CLIENT;
let TELEGRAM_CLIENT;
let wallet = null;

/**
 * Constants
 *
 * @type {string}
 */
const SOURCE_DISCORD = 'discord';
const SOURCE_SLACK = 'slack';
const SOURCE_TELEGRAM = 'telegram';
const TOKEN_DISCORD = process.env.BOT_DISCORD_TOKEN;
const TOKEN_SLACK = process.env.BOT_SLACK_TOKEN;
const TOKEN_TELEGRAM = process.env.BOT_TELEGRAM_TOKEN;
const CONNECT_TO_WALLET = process.env.CONNECT_TO_WALLET;


// defines app specific callback...
function cleanupFunction() {
    console.log('App specific cleanup code...');
    if (CONNECT_TO_WALLET) {
        wallet.walletstop((result) => {
            if (result) {
                console.log(result)
            }
        });
    }
}

// All of the following code is only needed for test demo

// Prevents the program from closing instantly
process.stdin.resume();

if (CONNECT_TO_WALLET){
    wallet = new Wallet()
    wallet.walletstart((result) => {
        if (result) {
            console.log(result)
        }
    });
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

        var response = processMessage(message, SOURCE_DISCORD);
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

        var response = processMessage(message, SOURCE_SLACK);
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
        console.log(message)
        console.log(message.chat.id);
        var response = processMessage(message, SOURCE_TELEGRAM);

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
//function remindAboutExchangeVotes(service) {
//    var voteMessage = 'Don\'t forget to vote for ECC to get listed on new exchanges!\r\n\r\n' +
//        'We\'re currently in the running for:\r\n' +
//        'COBINHOOD: https://cobinhood.canny.io/token-listing/p/ecc-coin-listing\r\n' +
//        'NEXT.exchange: https://nextexchange.featureupvote.com/suggestions/4595/please-add-ecc-coin\r\n' +
//        'CoinFalcon: https://feedback.coinfalcon.com/coin-request/p/ecc\r\n' +
//        'Lescovex: https://lescovex.featureupvote.com/suggestions/6241/ecc-coin-blockchain-services-for-the-masses\r\n\r\n' +
//        '_Please make sure to follow the rules for each site_';
//    if (discordClient && DISCORD_CHANNELS.ecc && service == 'discord') {
//        DISCORD_CHANNELS.ecc.send(voteMessage).catch((err) => {console.error(err);});
//    }
//    if (slackClient && SLACK_CHANNELS.ecc && service == 'slack') {
//        slackClient.sendMessage(voteMessage, SLACK_CHANNELS.ecc.id);
//    }
//    if (telegramBot && service == 'telegram') {
//        telegramBot.sendMessage(-1001313163406,  voteMessage, {parse_mode: 'Markdown'});
//    }
//};

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
//http
//    .createServer((req, res) => {
//        if (req.method == 'POST' && req.headers['content-type'] == 'application/json') {
//            var body = '';
//            req.on('data', chunk => {
//                body += chunk.toString();
//            });
//            req.on('end', () => {
//                try {
//                    var json = JSON.parse(body);
//                    if (json.channels && json.channels.slack && json.channels.slack.length > 0 && slackClient) {
//                        json.channels.slack.forEach((channel) => {
//                            if (SLACK_CHANNELS[cleanChannelName(channel)]) {
//                                slackClient.sendMessage(json.message, SLACK_CHANNELS[cleanChannelName(channel)].id);
//                            }
//                        });
//                    }
//                    res.end('{"success":true}');
//                } catch (err) {
//                    console.error(err);
//                    res.end('{"success":false,"message":"Server error"}');
//                }
//            });
//        } else {
//            res.end('{"success":false,"message":"Nah"}');
//        }
//    })
//    .listen(33788);