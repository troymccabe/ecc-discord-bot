const https = require('https');

module.exports = function(tx) {
    return new Promise((resolve, reject) => {
        var url = `https://chainz.cryptoid.info/ecc/api.dws?t=${tx}&q=txinfo`;
        https.get(
            url,
            (res) => {
                var data = '';
                res.on('data', function(chunk) {
                    data += chunk;
                });
                res.on('end', function() {
                    var txInfo = JSON.parse(data);
                    var response = `Hash: *${txInfo.hash}*\r\n` +
                        `Block height: *${txInfo.block} (${txInfo.confirmations})*\r\n` +
                        `Block date/time: *${new Date(txInfo.timestamp * 1000).toLocaleString()}*\r\n` +
                        `Total outputs: *${txInfo.total_output}*\r\n` +
                        `Fees: *${txInfo.fees}*\r\n\r\n`;

                    response += '*Inputs*:\r\n';
                    for (var i = 0; i < txInfo.inputs.length; i++) {
                        response += ` - ${txInfo.inputs[i].addr} (${txInfo.inputs[i].amount} ECC)\r\n`;
                    }
                    response += '\r\n*Outputs*:\r\n';
                    for (i = 0; i < txInfo.outputs.length; i++) {
                        response += ` - ${txInfo.outputs[i].addr} (${txInfo.outputs[i].amount} ECC)\r\n`;
                    }

                    resolve(response);
                });
            }
        ).on('error', (e) => {
            resolve(`Failed to retrieve tx information from ${url}`);
        });
    });
};