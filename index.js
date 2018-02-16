/**
 * ECC helper bot
 * 
 * Friendly helper for the ECC Discord & Slack servers
 * 
 * @author Troy McCabe <troymccabe@gmail.com>
 */

const SOURCE_DISCORD = 'discord';
const SOURCE_SLACK = 'slack';

function processMessage(message, source) {
    if (!message) {
        return;
    }
    
    if (message.match(/wh?en (moon|lambo)/igm)) {
        switch (source) {
            case SOURCE_DISCORD:
                return 'How should I know?? Go ask in <#409184678730268672>';

            case SOURCE_SLACK:
                return 'Check with #price-prediction on Discord: https://discord.gg/X2XVaQz';
        }
    }

    if (message.match(/\?help/igm)) {
        return (
            'I can provide information on the following topics (use the `?***` command to see details):\r\n\r\n' +
            '`?wiki`: Get the link to the wiki\r\n' + 
            '`?wiki.backup`: Get the link to the backup process wiki article\r\n' + 
            '`?wiki.faq`: Get the link to the FAQ wiki article\r\n' + 
            '`?wiki.installation`: Get the link to the installation wiki article\r\n' + 
            '`?wiki.staking`: Get the link to the staking wiki article'
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

    return;
}

/*
 * DISCORD
 */
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
        message.channel.send(response).catch(reason => {});
    }
});

discordClient.login(process.env.ECC_DISCORD_BOT_TOKEN);

/*
 * SLACK
 */
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
        slackClient.sendMessage(response, message.channel);
    }
});

slackClient.start();