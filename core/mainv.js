const { httpGet } = require('../util.js');
const { readlineSync } = require('../util.js');
const { cookie } = require('../util.js');
const { config } = require('../util.js');
const util = require('../util.js');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;

const viewAPI = new URL("https://api.bilibili.com/x/web-interface/view");
const playurlAPI = new URL("https://api.bilibili.com/x/player/playurl");
const statAPI = new URL("https://api.bilibili.com/x/web-interface/archive/stat");
const infoAPI = new URL("https://api.bilibili.com/x/player/pagelist");

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

var getPartNum = (input) => {
    let partFinder = input.match(/p=(\d+)/);
    if (partFinder) { return partFinder[1]; }
}
var getVideoInfo = async (input) => {
    let mav = input.match(/[aA][vV](\d+)/);
    let maid = mav ? mav : input.match(/^(\d+)$/);
    let mbvid = input.match(/[bB][vV]\w{10}/);
    if (!mbvid && !maid) {
        throw "input illegal";
    }
    let parameters = mbvid ? ["bvid", mbvid[0]] : maid ? ["aid", maid[1]] : null;
    viewAPI.searchParams.set(...parameters);
    let options = {
        hostname: viewAPI.hostname,
        port: 80,
        path: viewAPI.pathname + viewAPI.search,
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
        this.pages = data.pages;     //分p信息的list
    }
    showTitle() {
        util.printInfo(this.title);
    }
    setTitle(t) {
        this.title = t;
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
        let query = {
            avid: this.aid,
            cid: this.cid,
            qn: config.bestQuality,
            fnver: 0,
            fnval: this.isDASH ? 16 : 0,
            player: 1,
            otype: "json"
        }
        for (const k in query) {
            playurlAPI.searchParams.set(k, query[k]);
        }
        return playurlAPI;
    }
    async getPlayurl() {
        let rurl = this.fillPlayAPIUrl();
        let options = {
            hostname: rurl.hostname,
            port: 80,
            path: rurl.pathname + rurl.search,
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
                util.printErr("WARNING: cookie may be invalid");
            }
            util.printErr(`WARNING: the max quality is:\n${qualityText[highestQuality]}\n,but the quality will be downloaded/played is\n${qualityText[quality]}\ncontinue?(y/n)`);
            let line = await readlineSync();
            if (line == 'n') {
                process.exit();
            }
        }
        return response.data.durl[0].url;
    };
    async play() {
        let url = await this.getPlayurl();
        showQuality(url);       //根据url推断清晰度更直接
        let cmdString = `mpv --no-ytdl --referrer="https://www.bilibili.com" "${url}"`;
        exec(cmdString, (err, stdout, stderr) => {
            if (err) {
                util.printErr(err);
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
        var dlTask = spawn("aria2c", ['-s', '16', '-x', '16', '--check-certificate=false', '--continue=true', '--referer=https://www.bilibili.com', url, '-d', config.dlPath, '-o', fileName]);
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
        util.printWarn("NOT 1080P高码率 or ERROR!");
    } else {
        util.printInfo(qualityText[q]);
    }
};

module.exports = {
    Video,
    Page,
    getVideoInfo,
    getPartNum
}