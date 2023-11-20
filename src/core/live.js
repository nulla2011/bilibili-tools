const { session, config } = require('../utils');
const util = require('../utils');
const exec = require('child_process').exec;
const axios = require('axios');

const PLAY_API = new URL("https://api.live.bilibili.com/room/v1/Room/playUrl");
const PLAY_API_V2 = new URL("https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo")
const INFO_API = new URL("https://api.live.bilibili.com/room/v1/Room/get_info");
const USER_INFO_API = new URL("http://api.live.bilibili.com/live_user/v1/Master/info");

let getRoomID = (input) => {
    let m = input.match(/^\d+$/);
    let RoomID = m ? input : input.match(/live\.bilibili\.com\/(\d+)/)[1];
    if (!RoomID) {
        throw "input illegal";
    }
    return RoomID;
}
const formatMap = {
    flv: 0,
    ts: 1,
    mp4: 2
}
const concatUrl = (codec) => {
    const item = codec[0].url_info[0]
    return item.host + codec[0].base_url + item.extra
}
class Room {
    constructor(ID) {
        this.id = ID;
        this.format = config.liveFormat;
        this.isHevc = false;
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
    fillPlayAPIUrlV2(quality) {
        let query = {
            room_id: this.id,
            format: formatMap[this.format],
            protocol: "0,1",
            codec: this.isHevc ? 1 : 0,
            qn: quality,
            platform: "web",
            ptype: 8,
            dolby: 5,
            panorama: 1,
        }
        for (const k in query) {
            PLAY_API_V2.searchParams.set(k, query[k]);

        }
        return PLAY_API_V2;
    }
    async sendRequset2PlayAPI(quality) {
        let rurl = this.fillPlayAPIUrlV2(quality);
        let response = await axios.get(rurl.href,{
            headers: {
                'referer': 'https://live.bilibili.com/',
                'cookie': `SESSDATA=${session};`
            }
        }).then((r) => r.data).catch((error) => {
            util.handleAxiosErr(error);
        });
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
    async getPlayurlV2(quality) {
        let response = await this.sendRequset2PlayAPI(quality);
        const playurl = response.data.playurl_info.playurl
        if (!playurl) {
            util.printErr("URL dosn't exist!");
            process.exit(1);
        }
        this.playUrl = concatUrl(playurl.stream[0].format[0].codec);
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
        await this.getPlayurlV2(quality);
        console.log(this.playUrl);
        let cmdString = `mpv --referrer="https://live.bilibili.com" "${this.playUrl}"`;
        exec(cmdString, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
            if (err) {
                util.printErr(err);
            } else if (stderr) {
                util.printErr(stderr);
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
        }).then((r) => r.data).catch((error) => {
            util.handleAxiosErr(error);
        });
        if (response.code !== 0) {
            throw "code:" + response.code + " message:" + response.message;
        }
        this.uname = response.data.info.uname;
        this.uface = response.data.info.face;
    }
}

module.exports = {
    Room,
    getRoomID
}