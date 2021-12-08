const { httpGet } = require('../util.js');
const { config } = require('../util.js');
const util = require('../util.js');
const exec = require('child_process').exec;

const playAPI = new URL("https://api.live.bilibili.com/room/v1/Room/playUrl");
const infoAPI = new URL("https://api.live.bilibili.com/room/v1/Room/get_info");

var getRoomID = (input) => {
    let m = input.match(/^\d+$/);
    let RoomID = m ? m[0] : input.match(/live\.bilibili\.com\/(\d+)/)[1];
    if (!RoomID) {
        throw "input illegal";
    }
    return RoomID;
}
class Room {
    constructor(ID) {
        this.id = ID;
        this.isHLS = config.liveHlS;
    }
    fillPlayAPIUrl(quality) {
        let query = {
            cid: this.id,
            quality: quality,
            platform: this.isHLS ? "h5" : "web"  //选h5有可能是hls，选web好像全是flv
        }
        for (const k in query) {
            playAPI.searchParams.set(k, query[k]);
        }
        return playAPI;
    }
    async sendRequset2PlayAPI(quality) {
        let rurl = this.fillPlayAPIUrl(quality);
        let options = {
            hostname: rurl.hostname,
            port: 80,
            path: rurl.pathname + rurl.search,
            method: 'GET',
            headers: {
                'referer': 'http://live.bilibili.com/'
            }
        }
        let response = await httpGet(options);
        if (response.code !== 0) {
            throw "code:" + response.code + " message:" + response.message;
        }
        return response;
    }
    async getQualities() {
        let response = await this.sendRequset2PlayAPI(0);
        this.qualities = response.data.accept_quality;
    }
    async getPlayurl(quality) {
        let response = await this.sendRequset2PlayAPI(quality);
        this.playUrl = response.data.durl[0].url;
    }
    async getInfo() {
        infoAPI.searchParams.set("room_id", this.id)
        let options = {
            hostname: infoAPI.hostname,
            port: 80,
            path: infoAPI.pathname + infoAPI.search,
            method: 'GET',
            headers: {
                'referer': 'http://live.bilibili.com/'
            }
        }
        let response = await httpGet(options);
        if (response.code !== 0) {
            throw "code:" + response.code + " message:" + response.message;
        }
        this.online = response.data.online;    //人气
        this.live_status = response.data.live_status;   //播没播
        this.title = response.data.title;
        this.live_time = response.data.live_time;     //开播时间
        this.parent_area_name = response.data.parent_area_name;
        this.area_name = response.data.area_name;
    }
    async play(quality) {
        await this.getPlayurl(quality);
        // console.log(this.playUrl);
        let cmdString = `mpv "${this.playUrl}"`;
        exec(cmdString, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
            if (err) {
                util.printErr(err);
            } else {
                console.log(stdout);
            }
        });
    }
}

module.exports = {
    Room,
    getRoomID
}