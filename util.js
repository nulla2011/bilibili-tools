const http = require('http');
const url = require('url');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

const viewAPI = "https://api.bilibili.com/x/web-interface/view";
const playurlAPI = "https://api.bilibili.com/x/player/playurl";
const statAPI = "https://api.bilibili.com/x/web-interface/archive/stat";
const infoAPI = "https://api.bilibili.com/x/player/pagelist";

const qualityText = {
    120: "4K",
    116: "1080P60",
    112: "1080P 高码率",
    80: "1080P",
    74: "720P60",
    64: "720P",
    32: "480P",
    16: "360P"
};
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
var getVideoInfo = async (input) => {
    let av = input.match(/[aA][vV](\d+)/);
    let aid = av ? av[1] : input.match(/^\d+$/);
    let bvid = input.match(/[bB][vV]\w{10}/);
    if (!bvid && !aid) {
        throw "input illegal";
    }
    let parameters = bvid ? { bvid: bvid } : aid ? { aid: aid } : null;
    let fullUrl = viewAPI + url.format({ query: parameters });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET'
    };
    let response = await httpGet(options);
    if (response.code !== 0) {
        throw "code:" + response.code + " message:" + response.message;
    }
    return response.data;
};
class Video {
    constructor(data) {
        this.aid = data.aid;
        this.bvid = data.bvid;
        this.videos = data.videos;   //几个分p
        this.title = data.title;
        this.pages = data.pages;
    }
    showTitle() {
        console.log(chalk.bold.white(this.title));
    }
}
class Page extends Video {
    isDASH = false;
    constructor(vdata, pdata) {
        super(vdata);
        this.page = pdata.page;    //序号
        this.cid = pdata.cid;
        this.part = pdata.part;    //分p名
    }
    enableDASH() {
        this.isDASH = true;
    }
    fillPlayAPIUrl() {
        return playurlAPI + url.format({
            query: {
                avid: this.aid,
                cid: this.cid,
                qn: config.bestQuality,
                fnver: 0,
                fnval: this.isDASH ? 16 : 0,
                player: 1,
                otype: "json"
            }
        });
    }
    async getPlayurl() {
        let options = {
            hostname: "api.bilibili.com",
            port: 80,
            path: this.fillPlayAPIUrl().replace("https://api.bilibili.com", ""),
            method: 'GET',
            headers: {
                'referer': 'https://www.bilibili.com/',
                'cookie': cookie
            }
        };
        let response = await httpGet(options);
        if (response.code !== 0) {
            throw "code:" + response.code + " message:" + response.message;
        }
        let highestQuality = Math.max(...response.data.accept_quality);
        let quality = response.data.quality;
        if (quality != highestQuality) {
            if (quality == 64) {
                console.log(chalk.white.bold.bgRed("WARNING: cookie may be invalid"));
            }
            console.log(chalk.white.bold.bgRed(`WARNING: the max quality is:\n${qualityText[highestQuality]}\n,but the quality will be downloaded/played is\n${qualityText[quality]}\ncontinue?(y/n)`));
            line = await readlineSync();
            if (line == 'n') {
                process.exit();
            }
        }
        return response.data.durl[0].url;
    };
    async play() {
        let url = await this.getPlayurl();
        console.log(showQuality(url));       //根据url推断清晰度更直接
        let cmdString = `mpv --no-ytdl --referrer="https://www.bilibili.com" "${url}"`;
        exec(cmdString, (err, stdout, stderr) => {
            if (err) {
                console.error(chalk.white.bold.bgRed(err));
            } else {
                console.log(stdout);
            }
        });
    }
    async download() {
        let url = await this.getPlayurl();
        console.log(`P${this.page}: ${showQuality(url)}`);    //low quality warning
        let fileName = `${this.aid} - ${this.title}.flv`;
        if (this.videos > 1) {
            fileName = fileName.slice(0, -4) + `_p${this.page}_${this.part}.flv`;
        }
        var dlTask = spawn("aria2c", ['-s', '16', '-x', '16', '--check-certificate=false', '--referer=https://www.bilibili.com', url, '-d', config.dlPath, '-o', fileName]);
        dlTask.stdout.on('data', (data) => {
            if (data) {
                console.log(`P${this.page}: ${data}`);
            }
        });
        dlTask.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
        dlTask.on("close", (code) => {
            console.log(`child process ${this.page} exited with code ${code}`);
        });
    }
}

var getPlayurlDASH = async (url, cookie) => {

}
var showQuality = (url) => {
    let q = url.match(/-(\d+)\.flv\?/)[1];
    if (q < 112) {
        return chalk.white.bgHex('#909000').bold("NOT 1080P高码率 or ERROR!");
    } else {
        return chalk.bold.white(qualityText[q]);
    }
};
module.exports = {
    Video,
    Page,
    config,
    cookie,
    readlineSync,
    getVideoInfo
}