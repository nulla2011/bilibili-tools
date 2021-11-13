const http = require('http');
const readline = require('readline');
const fs = require('fs');
try {
    var chalk = require('chalk');
} catch (error) {
    chalk = null;
}

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
const printErr = (t) => {
    if (chalk) {
        console.error(chalk.white.bold.bgRed(t));
    } else {
        console.error(t);
    }
}
const printWarn=(t)=>{
    if (chalk) {
        console.error(chalk.white.bgHex('#909000').bold(t));
    } else {
        console.error(t);
    }
}
const printInfo=(t)=>{
    if (chalk) {
        console.error(chalk.white.bold(t));
    } else {
        console.error(t);
    }
}

module.exports = {
    config,
    cookie,
    readlineSync,
    httpGet,
    printErr,
    printWarn,
    printInfo
}