let responses = require('../responses');
const SOURCE_DISCORD = 'discord';
const SOURCE_SLACK = 'slack';
const SOURCE_TELEGRAM = 'telegram';

export function processMessage(message, source) {

    let messageText = null;
    if(source === SOURCE_DISCORD){
        messageText = message.content;
    }else{
        messageText = message.text;
    }
    if (!messageText) {
        return new Promise((resolve, reject) => {});
    }

    for (let i = 0; i < responses.length; i++) {
        let response = responses[i];
        if (new RegExp(response.pattern, response.pattern_flags || 'igm').test(messageText)) {
            if (response.response) {
                return response.response;
            } else if (response.response_lines) {
                return response.response_lines.join('');
            } else if (response.responses) {
                switch (source) {
                    case SOURCE_DISCORD:
                        return response.responses[SOURCE_DISCORD];

                    case SOURCE_SLACK:
                        return response.responses[SOURCE_SLACK];

                    case SOURCE_TELEGRAM:
                        return response.responses[SOURCE_TELEGRAM];
                }
            }
        }
    }

    var matches = messageText.match(/addr\((\w+)\)/i);
    if (matches && matches.length > 1) {
        return require('../lib/addr.js')(matches[1]);
    }

    var matches = messageText.match(/tx\((\w+)\)/i);
    if (matches && matches.length > 1) {
        return require('../lib/tx.js')(matches[1]);
    }

    if (message.chat.type !== null && message.chat.type === "private" && source === SOURCE_TELEGRAM){
        console.log('in here boys')
    }
    console.log(messageText)

    return;
}