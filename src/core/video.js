const fs = require('fs');
const { readlineSync, session, bili_jct, config, handleAxiosErr } = require('../utils');
const util = require('../utils');
const exec = require('child_process').exec;
const spawn = require('child_process').spawn;
const axios = require('axios');

const VIEW_API = new URL("https://api.bilibili.com/x/web-interface/view");
const PLAYURL_API = new URL("https://api.bilibili.com/x/player/playurl");
const STST_API = new URL("https://api.bilibili.com/x/web-interface/archive/stat");
const INFO_API = new URL("https://api.bilibili.com/x/player/pagelist");

const QUALITY_TEXT = {
    120: "4K",
    116: "1080P60",
    112: "1080P 高码率",
    80: "1080P",
    74: "720P60",
    64: "720P",
    32: "480P",
    16: "360P"
};
const HEVC_QUALITY_TEXT = {
    106: "1080P60",
    102: "1080P 高码率",
    77: "1080P",
    66: "720P",
    33: "480P",
    11: "360P"
}
const ARIA2_ARGS = ['-s', '16', '-x', '16', '--check-certificate=false', '--continue=true', '--referer=https://www.bilibili.com'];

let getPartNum = (input) => {
    let partFinder = input.match(/p=(\d+)/);
    if (partFinder) { return partFinder[1]; }
}
let getVideoInfo = async (input) => {
    let mav = input.match(/(?:^|(?<=\/))[aA][vV](\d+)/);
    let maid = mav ? mav : input.match(/^(\d+)$/);
    let mbvid = input.match(/(?:^|(?<=\/))[bB][vV][1-9a-km-zA-HJ-NP-Z]{10}/);
    if (!mbvid && !maid) {
        throw "input illegal";
    }
    let parameters = mbvid ? ["bvid", mbvid[0]] : maid ? ["aid", maid[1]] : null;
    VIEW_API.searchParams.set(...parameters);
    let response = await axios.get(VIEW_API.href).then(response => response.data).catch(err => handleAxiosErr(err));
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
        this.view = data.stat.view;   //播放量
        this.like = data.stat.like;     //点赞
        this.coin = data.stat.coin;    //硬币
        this.favorite = data.stat.favorite;   //收藏
        this.share = data.stat.share;    //分享
        this.reply = data.stat.reply;   //回复
        this.danmaku = data.stat.danmaku;   //弹幕
    }
    showTitle() {
        util.printInfo(this.title);
    }
}
class Page extends Video {
    constructor(vdata, pdata) {
        super(vdata);
        this.page = pdata.page;    //序号
        this.cid = pdata.cid;
        this.part = pdata.part;    //分p名
        this.isDASH = false;
        this.isHevc = false;
    }
    enableDASH() {
        this.isDASH = true;
    }
    enableHevc() {
        this.isHevc = true;
    }
    fillPlayAPIUrl() {
        let query = {
            avid: this.aid,
            cid: this.cid,
            qn: config.bestQuality,
            fnver: 0,
            fnval: this.isDASH ? 16 : 0,      //有其他选项(https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/video/videostream_url.md#fnval%E8%A7%86%E9%A2%91%E6%B5%81%E6%A0%BC%E5%BC%8F%E6%A0%87%E8%AF%86)
            player: 1,
            otype: "json"
        }
        for (const k in query) {
            PLAYURL_API.searchParams.set(k, query[k]);
        }
        return PLAYURL_API;
    }
    async getPlayurl() {
        let rurl = this.fillPlayAPIUrl();
        console.log(session);
        let response = await axios.get(rurl.href, {
            headers: {
                'referer': 'https://www.bilibili.com/',
                'cookie': `SESSDATA=${session}; bili_jct=${bili_jct}`
            }
        }).then(response => response.data).catch(err => handleAxiosErr(err));
        if (response.code !== 0) {
            throw "code:" + response.code + " message:" + response.message;
        }
        let highestQuality = Math.max(...response.data.accept_quality);
        let quality = response.data.quality;
        if (quality != highestQuality) {
            if (quality == 64) {
                util.printErr("WARNING: cookie may be invalid");
            }
            util.printErr(`WARNING: the max quality is:\n${QUALITY_TEXT[highestQuality]}\n,but the quality will be downloaded/played is\n${QUALITY_TEXT[quality]}\ncontinue?(y/n)`);
            let line = await readlineSync();
            if (line == 'n') {
                process.exit();
            }
        }
        if (this.isDASH) {
            let vQualityMatch = response.data.dash.video.filter(element => element.id == quality);
            let vUrl = vQualityMatch.find(el => el.codecs.startsWith(this.isHevc ? 'hev' : 'avc')).baseUrl;
            let audioBestQuality = response.data.dash.audio.reduce((max, cur) => (cur.id > max.id) ? cur : max);
            util.printInfo(`audio quality: ${audioBestQuality.id}`);
            return [vUrl, audioBestQuality.baseUrl];
        } else {
            return response.data.durl[0].url;
        }
    }
    async play(videoOn = 1, audioOn = 1) {
        let url = await this.getPlayurl();
        console.log(url);
        showQuality(url, this.isDASH); //根据url推断清晰度更直接
        let cmdString;
        if (this.isDASH) {
            switch (videoOn + audioOn) {
                case 2:
                    cmdString = `mpv --no-ytdl --referrer="https://www.bilibili.com" "${url[0]}" --audio-file="${url[1]}"`;
                    break;
                case 1:
                    cmdString = `mpv --no-ytdl --referrer="https://www.bilibili.com" "${url[videoOn == 1 ? 0 : (audioOn == 1 ? 1 : null)]}"`;
                    break;
                default:
                    util.printErr("video and audio are all off!");
                    process.exit();
                    break;
            }
        } else {
            cmdString = `mpv --no-ytdl --referrer="https://www.bilibili.com" "${url}"`;
        }
        exec(cmdString, (err, stdout, stderr) => {
            if (err) {
                util.printErr(err);
            } else {
                console.log(stdout);
            }
        });
    }
    async download(path, videoOn = 1, audioOn = 1) {
        let url = await this.getPlayurl();
        console.log(`P${this.page}: `);    //low quality warning
        showQuality(url, this.isDASH);
        let fileName = `${this.aid} - ${this.title}.flv`;
        if (this.videos > 1) {
            fileName = fileName.slice(0, -4) + `_p${this.page}_${this.part}.flv`;
        }
        let dlTask;
        if (this.isDASH) {
            switch (videoOn + audioOn) {
                case 2:
                    console.log("还没写，话说为什么要用这种方法下载呢？");
                    process.exit();
                    break;
                case 1:
                    fileName = fileName.slice(0, -4) + `_${videoOn == 1 ? "video.mp4" : (audioOn == 1 ? "audio.m4s" : null)}`;
                    dlTask = spawn("aria2c", ARIA2_ARGS.concat([url[videoOn == 1 ? 0 : (audioOn == 1 ? 1 : null)], '-d', path, '-o', fileName]));
                    break;
                default:
                    util.printErr("video and audio are all off!");
                    process.exit();
                    break;
            }
        } else {
            dlTask = spawn("aria2c", ARIA2_ARGS.concat([url, '-d', path, '-o', util.clearIllegalChars(fileName)]));      //不管是windows还是unix都有不允许当文件名的字符
        }
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
            if (audioOn && !videoOn) {
                console.log("transcoding...");
                exec(`ffmpeg -i "${path + "/" + fileName}" -c:a copy "${path + "/" + fileName.slice(0, -4) + ".m4a"}"`, (err, stdout, stderr) => {
                    if (err) {
                        util.printErr(err);
                    } else {
                        console.log(stdout);
                        fs.unlinkSync(`${path}/${fileName}`);
                    }
                });
            }
        });
    }
}

let showQuality = (url, isDash) => {
    let q;
    if (isDash) {
        q = url[0].match(/-30+(\d+)\.m4s\?/)[1];
    } else {
        q = url.match(/-(\d+)\.(?:flv|mp4)\?/)[1];
    }
    if (q < 112) {
        util.printInfo(QUALITY_TEXT[q]);
        util.printWarn("NOT 1080P高码率 or ERROR!");
    } else {
        util.printInfo(QUALITY_TEXT[q]);
    }
};

module.exports = {
    Video,
    Page,
    getVideoInfo,
    getPartNum
}