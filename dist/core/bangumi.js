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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bangumi = exports.formatSSID = void 0;
const axios_1 = __importDefault(require("axios"));
const BANGUMI_INFO_API = new URL('http://api.bilibili.com/pgc/view/web/season');
function formatSSID(input) {
    var _a;
    let m = input.match(/^\d+$/);
    let ssid = m ? m[0] : (_a = input.match(/www\.bilibili\.com\/bangumi\/play\/ss(\d+)/)) === null || _a === void 0 ? void 0 : _a[1];
    if (!ssid)
        throw "input illegal";
    return ssid;
}
exports.formatSSID = formatSSID;
class Bangumi {
    constructor(ssid) {
        this.ssid = ssid;
    }
    getStat() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield axios_1.default.get(BANGUMI_INFO_API.href, {
                params: {
                    season_id: this.ssid
                }
            });
            let stat = response.data.result.stat;
            Object.assign(this, {
                views: stat.views,
                favorites: stat.favorites,
                reply: stat.reply,
                coins: stat.coins,
                share: stat.share,
                danmakus: stat.danmakus,
            });
        });
    }
    getAids() {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield axios_1.default.get(BANGUMI_INFO_API.href, {
                params: {
                    season_id: this.ssid
                }
            });
            this.aidList = response.data.result.episodes.sort((e1, e2) => parseInt(e1.title) - parseInt(e2.title)).map(ep => ep.aid);
        });
    }
}
exports.Bangumi = Bangumi;
