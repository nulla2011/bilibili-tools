"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
Object.defineProperty(exports, "__esModule", { value: true });
const mainv_js_1 = require("../core/mainv.js");
const fs = __importStar(require("fs"));
const node_notifier_1 = __importDefault(require("node-notifier"));
const normalInterval = 1 * 60 * 60 * 1000;
const testInterval = 1 * 60 * 1000;
const interval = testInterval;
const getInfo = (input) => __awaiter(void 0, void 0, void 0, function* () {
    let d;
    try {
        d = yield (0, mainv_js_1.getVideoInfo)(input);
    }
    catch (error) {
        console.error(error);
        node_notifier_1.default.notify({
            title: "get info error!",
            message: "get info error!",
            sound: true
        }, (error, response) => {
            process.exit(0);
        });
    }
    let result = {
        aid: d.aid,
        videos: d.videos,
        pic: d.pic,
        title: d.title,
        desc: d.desc,
        duration: d.duration,
        cids: d.pages.map(p => p.cid)
    };
    return result;
});
const compare = (a, b) => {
    for (const k in a) {
        if (Array.isArray(a[k])) {
            if (a[k].length != a[k].length) {
                return false;
            }
            return a[k].every(i => a[k][i] === b[k][i]);
        }
        else {
            if (a[k] !== b[k]) {
                return false;
            }
        }
    }
    return true;
};
const diff = (a, b) => {
    for (const k in a) {
        if (Array.isArray(a[k])) {
            let isChanged = false;
            if (a[k].length != a[k].length) {
                isChanged = true;
            }
            isChanged = isChanged || !(a[k].every(i => a[k][i] === b[k][i]));
            if (isChanged) {
                console.log(`分p: ${a[k]} -> ${b[k]}`);
            }
        }
        else {
            if (a[k] !== b[k]) {
                console.log(`${k}: ${a[k]} -> ${b[k]}`);
            }
        }
    }
};
const notifyChange = (text) => {
    node_notifier_1.default.notify({
        title: "Video changed!",
        message: text,
        sound: true
    });
};
const main = (input) => __awaiter(void 0, void 0, void 0, function* () {
    let info = yield getInfo(input);
    let oldInfo;
    try {
        oldInfo = JSON.parse(fs.readFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, 'utf-8'));
    }
    catch (e) {
        if (e.code === "ENOENT") { //没有缓存
            console.error(`no cache for ${info.aid}`);
            oldInfo = info;
            try {
                fs.copyFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, `${__dirname}/../cache/videoinfo-${info.aid}.json.old`);
            }
            catch (e) { }
            finally {
                fs.writeFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
            }
        }
        else {
            console.error("Unknown error");
            process.exit(0);
        }
    }
    if (!compare(info, oldInfo)) {
        let currentTime = new Date().toString().replace(' (中国标准时间)', '').slice(4);
        console.log(`[${currentTime}] 「${info.aid}-${info.title}」 changed!`);
        console.log(diff(oldInfo, info));
        notifyChange(`${info.aid}-${info.title} changed!`);
        // util.alarm();
        // exec(`msg %username% "video ${info.title} changed!"`);
    }
    fs.writeFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
    setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
        oldInfo = JSON.parse(fs.readFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, 'utf-8'));
        info = yield getInfo(input);
        let currentTime = new Date().toString().replace(' (中国标准时间)', '').slice(4);
        if (!compare(info, oldInfo)) {
            console.log(`!!![${currentTime}] 「${info.aid}-${info.title}」 changed!`);
            console.log(diff(oldInfo, info));
            notifyChange(`${info.aid}-${info.title} changed!`);
            // util.alarm();
            // exec(`msg %username% "video ${info.title} changed!"`);
        }
        else {
            console.log(`[${currentTime}] 「${info.title}」 no change`);
        }
        fs.writeFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
    }), interval);
    process.on('SIGINT', () => {
        console.log('exit');
        fs.writeFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
        process.exit();
    });
    // process.on("message", (msg) => {
    //   if (msg == 'shutdown') {
    //     exec('msg %username% "11111"');
    //     console.log('exit');
    //     fs.writeFileSync(`cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
    //   }
    // });
});
main(process.argv[2]);
