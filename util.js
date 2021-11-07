const http = require('http');
const readline = require('readline');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const cookie = fs.readFileSync(config.cookieFile, 'utf8');

const readlineSync = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        //prompt: 'input link or BV:'
    });
    return new Promise((resolve) => {
        rl.prompt();
        rl.on('line', (line) => {
            rl.close();
            resolve(line);
        });
    });
};
const httpGet = (options) => {
    return new Promise((resolve, reject) => {
        var req = http.request(options, (res) => {
            let str = "";
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            res.on('data', (chunk) => { str += chunk });
            res.on('end', () => {
                resolve(JSON.parse(str));
            });
        });
        req.on('error', function (err) {
            reject(err);
        });
        req.end();
    });
};

module.exports = {
    config,
    cookie,
    readlineSync,
    httpGet
}