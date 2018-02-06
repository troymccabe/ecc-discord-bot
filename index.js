/**
 * ECC Discord bot
 * 
 * Friendly helper for the ECC Discord server
 * 
 * @author Troy McCabe <troymccabe@gmail.com>
 */

const Discord = require("discord.js");

var client = new Discord.Client();
client.on('ready', () => {});
client.on('message', msg => {
    /* Lambo/Moon check */
    var matches = msg.content.match(/wh?en (moon|lambo)/igm);
    if (matches && matches.length) {
        msg.channel.send('How should I know?? Go ask in #price-prediction')
            .catch(reason => {});
    }
});

client.login(process.env.ECC_DISCORD_BOT_TOKEN);