"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const bangumi_1 = require("./core/bangumi");
const video_1 = require("./core/video");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_schedule_1 = __importDefault(require("node-schedule"));
const utils_1 = require("./utils");
function notifyErrot(err) {
}
function initStatData(ssid) {
    let dataPath = path.resolve(`${__dirname}/../bangumi_stats/${ssid}.json`);
    try {
        return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    catch (e) {
        if (e.code === "ENOENT") {
            console.error(`no data for ${ssid}, create`);
            try {
                fs.copyFileSync(dataPath, dataPath + '.old');
            }
            catch (e) { }
            finally {
                return [];
            }
        }
        else {
            console.error("Unknown error");
            process.exit(0);
        }
    }
}
function main(input) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!input) {
            console.log(`usage:\n\
node dist/stat-bangumi-every-day.js [ssid or season url (for example: https://www.bilibili.com/bangumi/play/ss40264)]\n\
using pm2 is recommended:\n\
pm2 start dist/stat-bangumi-every-day.js -f -- [ssid]`);
            process.exit(0);
        }
        let ssid;
        try {
            ssid = (0, bangumi_1.formatSSID)(input);
        }
        catch (e) {
            console.error(e);
            process.exit(0);
        }
        let JSONDATA = initStatData(ssid);
        let bgm = new bangumi_1.Bangumi(ssid);
        try {
            yield bgm.getAids();
        }
        catch (error) {
            //notify?
            process.exit(0);
        }
        let rule = new node_schedule_1.default.RecurrenceRule();
        // rule.hour=[11,23];
        rule.minute = [0, 20, 40];
        // rule.second = [0, 10, 20, 30, 40, 50];  //test rule
        node_schedule_1.default.scheduleJob(rule, () => __awaiter(this, void 0, void 0, function* () {
            yield bgm.getStat();
            // await bgm.getAids();     //更新时间一定在没启动的时候吗？
            let videoStats = {};
            for (const [i, aid] of bgm.aidList.entries()) {
                let video = new video_1.Video(yield (0, video_1.getVideoInfo)(aid.toString()));
                videoStats[i + 1] = {
                    aid,
                    view: video.view,
                    like: video.like,
                    coin: video.coin,
                    favorite: video.favorite,
                    share: video.share,
                    reply: video.reply,
                    danmaku: video.danmaku,
                };
            }
            let time = (0, utils_1.formatDate)(new Date());
            JSONDATA.push({
                time,
                stat: {
                    views: bgm.views,
                    favorites: bgm.favorites,
                    reply: bgm.reply,
                    coins: bgm.coins,
                    share: bgm.share,
                    danmakus: bgm.danmakus,
                },
                episode_stats: videoStats,
            });
            try {
                fs.writeFileSync(path.resolve(`${__dirname}/../bangumi_stats/${ssid}.json`), JSON.stringify(JSONDATA));
                console.log(`[${time}] write success!`);
            }
            catch (error) {
                console.error(error);
            }
        }));
    });
}
main((_a = process.argv) === null || _a === void 0 ? void 0 : _a[2]);
