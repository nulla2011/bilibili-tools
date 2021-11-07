const { httpGet } = require('../util.js');
const { readlineSync } = require('../util.js');
const { cookie } = require('../util.js');
const { config } = require('../util.js');
const url = require('url');
const chalk = require('chalk');
const exec = require('child_process').exec;

const playAPI = "https://api.live.bilibili.com/room/v1/Room/playUrl";

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
    }
    fillPlayAPIUrl(quality) {
        return playAPI + url.format({
            query: {
                cid: this.id,
                quality: quality,
                platform: "h5"  //选h5有可能是hls，选web好像全是flv
            }
        });
    }
    async sendRequset2PlayAPI(quality) {
        let options = {
            hostname: "api.live.bilibili.com",
            port: 80,
            path: this.fillPlayAPIUrl(quality).replace("https://api.live.bilibili.com", ""),
            method: 'GET',
            headers: {
                'referer': 'http://www.bilibili.com/'
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
        return response.data.accept_quality;
    }
    async getPlayurl(quality) {
        let response = await this.sendRequset2PlayAPI(quality);
        return response.data.durl[0].url;
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