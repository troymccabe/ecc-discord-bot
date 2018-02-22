/**
 * ECC helper bot
 * 
 * Friendly helper for the ECC Discord & Slack servers
 * 
 * @author Troy McCabe <troymccabe@gmail.com>
 */

const SOURCE_DISCORD = 'discord';
const SOURCE_SLACK = 'slack';
const SOURCE_TELEGRAM = 'telegram';

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
if (process.env.ECC_DISCORD_BOT_TOKEN) {
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

    discordClient.login(process.env.ECC_DISCORD_BOT_TOKEN);
}

/*
 * SLACK
 */
if (process.env.ECC_SLACK_BOT_TOKEN) {
    const { RtmClient, CLIENT_EVENTS, RTM_EVENTS } = require('@slack/client');

    const appData = {};
    const slackClient = new RtmClient(
        process.env.ECC_SLACK_BOT_TOKEN, 
        {dataStore: false, useRtmConnect: true,}
    );

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

        var response = processMessage(message.text, SOURCE_DISCORD);
        if (response) {
            if (typeof response == 'string') {
                slackClient.sendMessage(response, message.channel);
            } else if (response instanceof Promise) {
                response.then((val) => {slackClient.sendMessage(val, message.channel);});
            }
        }
    });

    slackClient.start();
}

/*
 * TELEGRAM
 */
if (process.env.ECC_TELEGRAM_BOT_TOKEN) {
    const TelegramBot = require('node-telegram-bot-api');
    const telegramBot = new TelegramBot(process.env.ECC_TELEGRAM_BOT_TOKEN, {polling: {interval: 0, params: {timeout: 200}}});

    telegramBot.on('message', (message) => {
        var response = processMessage(message.text, SOURCE_TELEGRAM);

        if (typeof response == 'string') {
            telegramBot.sendMessage(message.chat.id, response, {parse_mode: 'Markdown'});
        } else if (response instanceof Promise) {
            response.then((val) => {telegramBot.sendMessage(message.chat.id, val, {parse_mode: 'Markdown'});});
        }
    });
}