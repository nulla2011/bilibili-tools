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
const util = require('./utils');
const { Video, Page } = require('./core/video.js');
const mainv = require('./core/video.js');
const main = (input, path = util.config.dlPath, title, dash = false, videoOn = 1, audioOn = 1) => __awaiter(void 0, void 0, void 0, function* () {
    let line;
    if (input == undefined) {
        console.log("input link or BV or aid:");
        line = yield util.readlineSync();
    }
    else {
        line = input;
    }
    let videoInfoData;
    try {
        videoInfoData = yield mainv.getVideoInfo(line);
    }
    catch (e) {
        util.printErr(e);
        process.exit(1);
    }
    let video = new Video(videoInfoData);
    video.showTitle();
    let pageNum = mainv.getPartNum(line);
    let dlList = [];
    if (video.videos === 1) {
        dlList = video.pages;
        console.log("only 1 part, downloading..");
    }
    else if (pageNum) {
        dlList = [video.pages[pageNum - 1]];
        console.log("page number has been inputed, downloading..");
    }
    else {
        for (let item of video.pages) {
            console.log(item.page.toString().padStart(2, '0'), item.part);
        }
        console.log(video.videos + " parts, which do you want?");
        let inp = yield util.readlineSync();
        if (inp == '') {
            dlList = video.pages;
        }
        else {
            for (let i of inp.split(/[ ,]/)) {
                dlList.push(video.pages[i - 1]);
            }
        }
    }
    for (let pageInfo of dlList) {
        let page = new Page(videoInfoData, pageInfo);
        if (title) {
            console.log(`change title to ${title}, continue? (y/n)`);
            line = yield util.readlineSync();
            if (line == 'y') {
                page.title = title;
            }
        }
        if (dash) {
            page.enableDASH();
        }
        try {
            page.download(path, videoOn, audioOn);
        }
        catch (e) {
            util.printErr(e);
        }
    }
});
if (require.main === module) {
    main(process.argv[2]);
}
else {
    module.exports = { main };
}
