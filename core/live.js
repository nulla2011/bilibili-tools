const { httpGet } = require('../util.js');
const { readlineSync } = require('../util.js');
const { config } = require('../util.js');
const chalk = require('chalk');
const exec = require('child_process').exec;

const playAPI = new URL("https://api.live.bilibili.com/room/v1/Room/playUrl");
const infoAPI = new URL("https://api.live.bilibili.com/room/v1/Room/get_info");

var getRoomID = (input) => {
    let m = input.match(/^\d+$/);
    let RoomID = m ? m : input.match(/live\.bilibili\.com\/(\d+)/)[1];
    if (!RoomID) {
        throw "input illegal";
    }
    return RoomID;
}
class Room {
    constructor(ID) {
        this.id = ID;
        this.qualities;
        this.online;        //人气
        this.live_status;    //播没播
        this.title;
        this.live_time;      //开播时间
        this.parent_area_name;
        this.area_name;
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
        return response.data.durl[0].url;
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
        this.online = response.data.online;
        this.live_status = response.data.live_status;
        this.title = response.data.title;
        this.live_time = response.data.live_time;
        this.parent_area_name = response.data.parent_area_name;
        this.area_name = response.data.area_name;
    }
    async play(quality) {
        let url = await this.getPlayurl(quality);
        let cmdString = `mpv "${url}"`;
        exec(cmdString, (err, stdout, stderr) => {
            if (err) {
                console.error(chalk.white.bold.bgRed(err));
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