const http = require('http');
const readline = require('readline');
const fs = require('fs');
let config = require('../../config.json')
let chalk;
try {
    chalk = require('chalk');
} catch (error) {
    chalk = null;
}

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
const timeout = (delay = 300) => {
    return new Promise(resolve => setTimeout(resolve, delay));
};
const alarm = async () => {
    process.stdout.write('\x07');
    timeout().then(() => {
        process.stdout.write('\x07');
        return timeout();
    }).then(() => {
        process.stdout.write('\x07');
        return timeout(2000);
    }).then(() => {
        process.stdout.write('\x07');
        return timeout();
    }).then(() => {
        process.stdout.write('\x07');
        return timeout();
    }).then(() => {
        process.stdout.write('\x07');
    });
};
const printErr = (t) => {
    if (chalk) {
        console.error(chalk.white.bold.bgRed(t));
    } else {
        console.error(t);
    }
};
const printWarn = (t) => {
    if (chalk) {
        console.log(chalk.white.bgHex('#909000').bold(t));
    } else {
        console.log(t);
    }
};
const printInfo = (t) => {
    if (chalk) {
        console.log(chalk.white.bold(t));
    } else {
        console.log(t);
    }
};
const formatDate = (date) => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
};
const formatTime = (date) => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
};
const escape = (string) => {
    return string.replace(/(["'$`\\])/g, '\\$1');
}
const clearIllegalChars = (string) => {
    return string.replace(/[\\/:*?"<>|]/g, '_').replace(/!!/g, '__');
}
const handleAxiosErr = (error) => {
    // if (error.code == 'ETIMEDOUT') {
    //     printErr(`[${formatDate(new Date())}] ${error.code} ${error.address}\n${error.request._currentUrl}`);
    // } else if (error.code == 'ENOTFOUND') {
    //     printErr(`[${formatDate(new Date())}] ${error.code} ${error.hostname}\n${error.request._currentUrl}`);
    // } else if (error.code == 'ECONNRESET') {
    //     printErr(`[${util.formatDate(new Date())}] ${error.code}\n${error.request._currentUrl}`);
    // } else {
    //     printErr(error);
    // }
    // printErr(`[${formatDate(new Date())}] ${error}`);
    throw `[${formatDate(new Date())}] ${error} at ${error.request._currentUrl}`;
}
const showExtension = (url) => {
    return url.match(/(?<=\/[^/.]+\.)\w+(?=\?)/)[0];
}


// let config, cookie;
// try {
//     config = JSON.parse(fs.readFileSync('../config.json', 'utf8'));
// } catch (error) {
//     if (error.code == "ENOENT") {
//         printErr("No config file, creating..");
//         try {
//             fs.copyFileSync("config.json", "config.json.old");
//         } catch (e) { } finally {
//             fs.copyFileSync("config-example.json", "config.json");
//             console.log("Create complete! Please edit config.json");
//             process.exit(0);
//         }
//     } else {
//         printErr("Unknown error");
//     }
// }
// try {
//     cookie = fs.readFileSync(config.cookieFile, 'utf8');
// } catch (error) {
//     if (error.code == "ENOENT") {
//         printErr("No cookie file, creating..");
//         try {
//             fs.copyFileSync(config.cookieFile, `${config.cookieFile}.old`);
//         } catch (e) { } finally {
//             fs.writeFileSync(config.cookieFile, "");
//             console.log("Create complete! Please edit cookies.ck");
//             process.exit(0);
//         }
//     } else {
//         printErr("Unknown error");
//     }
// }
let session = config.SESSDATA;
// let bili_jct = config.bili_jct;

module.exports = {
    config,
    session,
    // bili_jct,
    readlineSync,
    httpGet,
    printErr,
    printWarn,
    printInfo,
    formatDate,
    formatTime,
    clearIllegalChars,
    handleAxiosErr,
    showExtension,
}