const https = require('https');

module.exports = function(addr) {
    return new Promise((resolve, reject) => {
        var returnData = {'balance': null, 'first_seen': null};
        var getFormattedMessage = function(json) {
            if (json.balance !== null && json.first_seen !== null) {
                return `Balance: *${json.balance} ECC*\r\nFirst seen: *${json.first_seen}*`;
            } else {
                return null;
            }
        };
        var urls = [
            {'type': 'balance', 'url': `https://chainz.cryptoid.info/ecc/api.dws?a=${addr}&q=getbalance`},
            {'type': 'first_seen', 'url': `https://chainz.cryptoid.info/ecc/api.dws?a=${addr}&q=addressfirstseen`}
        ];
        urls.forEach((item) => {
            https.get(
                item.url,
                (res) => {
                    var data = '';
                    res.on('data', function(chunk) {
                        data += chunk;
                    });
                    res.on('end', function() {
                        returnData[item.type] = data;

                        var response = getFormattedMessage(returnData);
                        if (response) {
                            resolve(response);
                        }
                    });
                }).on('error', (e) => {
                    resolve(`Failed to retrieve address information from ${item.url}`);
                });
        });
    });
};