"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
};
class Room {
    constructor(ID) {
        this.id = ID;
        this.isHLS = config.liveHlS;
    }
    fillPlayAPIUrl(quality) {
        let query = {
            cid: this.id,
            quality: quality,
            platform: this.isHLS ? "h5" : "web" //选h5有可能是hls，选web好像全是flv
        };
        for (const k in query) {
            PLAY_API.searchParams.set(k, query[k]);
        }
        return PLAY_API;
    }
    sendRequset2PlayAPI(quality) {
        return __awaiter(this, void 0, void 0, function* () {
            let rurl = this.fillPlayAPIUrl(quality);
            let response = yield axios.get(rurl.href);
            if (response.data.code !== 0) {
                throw "code:" + response.data.code + " message:" + response.data.message;
            }
            return response.data;
        });
    }
    getQualities() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.sendRequset2PlayAPI(0);
            this.qualities = response.data.accept_quality;
        });
    }
    getPlayurl(quality) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this.sendRequset2PlayAPI(quality);
            this.playUrl = response.data.durl[0].url;
        });
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield axios.get(INFO_API.href, {
                params: {
                    room_id: this.id
                }
            });
            let rdata = response.data;
            if (rdata.code !== 0) {
                throw "code:" + rdata.code + " message:" + rdata.message;
            }
            this.online = rdata.data.online; //人气
            this.live_status = rdata.data.live_status; //播没播
            this.title = rdata.data.title;
            this.live_time = rdata.data.live_time; //开播时间
            this.parent_area_name = rdata.data.parent_area_name;
            this.area_name = rdata.data.area_name;
            this.uid = rdata.data.uid; //同主站uid
        });
    }
    play(quality) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.getPlayurl(quality);
            // console.log(this.playUrl);
            let cmdString = `mpv "${this.playUrl}"`;
            exec(cmdString, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
                if (err) {
                    util.printErr(err);
                }
                else {
                    console.log(stdout);
                }
            });
        });
    }
    getUserInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.uid)
                yield this.getInfo();
            let response = yield axios.get(USER_INFO_API.href, {
                params: {
                    uid: this.uid
                }
            });
            let rdata = response.data;
            if (rdata.code !== 0) {
                throw "code:" + rdata.code + " message:" + rdata.message;
            }
            this.uname = rdata.data.info.uname;
            this.uface = rdata.data.info.face;
        });
    }
}
module.exports = {
    Room,
    getRoomID
};
