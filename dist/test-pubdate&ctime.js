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
Object.defineProperty(exports, "__esModule", { value: true });
const video_js_1 = require("./core/video.js");
(() => __awaiter(void 0, void 0, void 0, function* () {
    let vdata = yield (0, video_js_1.getVideoInfo)(process.argv[2]);
    let times = {
        pubdate: vdata.pubdate,
        ctime: vdata.ctime
    };
    if (times.pubdate === times.ctime) {
        console.log("match");
    }
    else {
        console.log(new Date(times.pubdate * 1000).toLocaleString(), new Date(times.ctime * 1000).toLocaleString());
    }
}))();
