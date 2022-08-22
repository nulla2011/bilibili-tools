const { config } = require('../utils');
const util = require('../utils');
const exec = require('child_process').exec;
const axios = require('axios');

const PLAY_API = new URL("https://api.live.bilibili.com/room/v1/Room/playUrl");
const INFO_API = new URL("https://api.live.bilibili.com/room/v1/Room/get_info");
const USER_INFO_API = new URL("http://api.live.bilibili.com/live_user/v1/Master/info");

let getRoomID = (input) => {
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
            PLAY_API.searchParams.set(k, query[k]);
        }
        return PLAY_API;
    }
    async sendRequset2PlayAPI(quality) {
        let rurl = this.fillPlayAPIUrl(quality);
        let response = await axios.get(rurl.href);
        if (response.data.code !== 0) {
            throw "code:" + response.data.code + " message:" + response.data.message;
        }
        return response.data;
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
        let response = await axios.get(INFO_API.href, {
            params: {
                room_id: this.id
            }
        }).catch((error) => {
            util.handleAxiosErr(error);
        });
        let rdata = response.data
        if (rdata.code != 0) {
            throw "code:" + rdata.code + " message:" + rdata.message;
        }
        this.online = rdata.data.online;    //人气
        this.live_status = rdata.data.live_status;   //播没播
        this.title = rdata.data.title;
        this.live_time = rdata.data.live_time;     //开播时间
        this.parent_area_name = rdata.data.parent_area_name;
        this.area_name = rdata.data.area_name;
        this.uid = rdata.data.uid;       //同主站uid
        this.room_id = rdata.data.room_id;   //真实 id
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
    async getUserInfo() {
        if (!this.uid) await this.getInfo();
        let response = await axios.get(USER_INFO_API.href, {
            params: {
                uid: this.uid
            }
        }).catch((error) => {
            util.handleAxiosErr(error);
        });
        let rdata = response.data;
        if (rdata.code !== 0) {
            throw "code:" + rdata.code + " message:" + rdata.message;
        }
        this.uname = rdata.data.info.uname;
        this.uface = rdata.data.info.face;
    }
}

module.exports = {
    Room,
    getRoomID
}