const http = require('http');
const url = require('url');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');

const infoAPI = "https://api.bilibili.com/x/player/pagelist";
const playurlAPI = "https://api.bilibili.com/x/player/playurl";
const statAPI = "https://api.bilibili.com/x/web-interface/archive/stat";
const viewAPI = "https://api.bilibili.com/x/web-interface/view";

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
const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
const cookie = fs.readFileSync(settings.cookieFile, 'utf8');

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
            req.on('error', function (err) {
                reject(err);
            });
        });
        req.end();
    });
};
var input2Bv = async () => {
    console.log("input link or BV or aid:");
    let line = await readlineSync();
    let bvid;
    let av = line.match(/[aA][vV](\d+)/);
    let avid = line.match(/^\d+$/);
    if (av) {
        bvid = await av2bv(av[1]);
    } else if (avid) {
        bvid = await av2bv(avid);
    } else {
        bvid = line.match(/[bB][vV]\w{10}/);
    }
    console.log(bvid);
    return bvid;
}
var getPartinfo = async (bv) => {
    let fullUrl = infoAPI + url.format({
        query: {
            bvid: bv,
            jsonp: "jsonp"
        }
    });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET'
    };
    let response = await httpGet(options);
    return response;
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
    let info = new Object();
    info.bvid = response.data.bvid;
    info.aid = response.data.aid;
    info.videos = response.data.videos;  //几个分p
    info.title = response.data.title;
    info.pages = [];
    for (let item of response.data.pages) {
        let page = new Object();
        page.page = item.page;    //序号
        page.cid = item.cid;
        page.part = item.part;   //分p名
        info.pages.push(page);
    }
    return info;
};
var fullPlayAPIUrl = (av, cid, isDASH) => {
    return playurlAPI + url.format({
        query: {
            avid: av,
            cid: cid,
            qn: settings.bestQuality,        //quality
            fnver: 0,
            fnval: isDASH ? 16 : 0,
            player: 1,
            otype: "json"
        }
    });
}
var getPlayurl = async (url, cookie) => {
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: url.replace("https://api.bilibili.com", ""),
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
        console.log(chalk.white.bold.bgRed(`WARNING: the max quality is:\n${qualityText[highestQuality]}\n,but the quality will be downloaded/play is\n${qualityText[quality]}\ncontinue?(y/n)`));
        line = await readlineSync();
        if (line == 'n') {
            process.exit();
        }
    }
    return response.data.durl[0].url;
};
var getPlayurlDASH = async (av, cid, cookie) => {

}
var bv2av = async (bv) => {
    let fullUrl = viewAPI + url.format({
        query: {
            bvid: bv
        }
    });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET'
    };
    let response = await httpGet(options);
    return response.data.aid;
};
var av2bv = async (av) => {
    let fullUrl = viewAPI + url.format({
        query: {
            aid: av
        }
    });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET'
    };
    let response = await httpGet(options);
    return response.data.bvid;
};
var showQuality = (url) => {
    let q = url.match(/-(\d+)\.flv\?/)[1];
    if (q < 112) {
        return chalk.white.bgHex('#909000').bold("NOT 1080P高码率 or ERROR!");
    } else {
        return chalk.bold.white(qualityText[q]);
    }
};
module.exports = {
    settings,
    cookie,
    readlineSync,
    getVideoInfo,
    getPlayurl,
    fullPlayAPIUrl,
    showQuality
}