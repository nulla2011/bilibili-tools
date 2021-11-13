const chalk = require('chalk');
const util = require('./util.js');
const { Video } = require('./core/mainv.js');
const { Page } = require('./core/mainv.js');
const mainv = require('./core/mainv.js');

const main = async (arg, title) => {
    let line;
    if (arg == undefined) {
        console.log("input link or BV or aid:");
        line = await util.readlineSync();
    } else {
        line = arg;
    }
    let videoInfoData;
    try {
        videoInfoData = await mainv.getVideoInfo(line);
    }
    catch (e) {
        console.error(chalk.white.bold.bgRed(e));
        process.exit(1);
    }
    let video = new Video(videoInfoData);
    video.showTitle();
    let pageNum = mainv.getPartNum(line);
    let dlList = [];
    if (video.videos === 1) {
        dlList = video.pages;
        console.log("only 1 part, downloading..");
    } else if (pageNum) {
        dlList = [video.pages[pageNum - 1]];
        console.log("page number has been inputed, downloading..");
    } else {
        for (let item of video.pages) {
            console.log(item.page.toString().padStart(2, '0'), item.part);
        }
        console.log(video.videos + " parts, which do you want?");
        let inp = await util.readlineSync();
        if (inp == '') {
            dlList = video.pages;
        } else {
            for (let i of inp.split(/[ ,]/)) {
                dlList.push(video.pages[i - 1])
            }
        }
    }
    for (let pageInfo of dlList) {
        let page = new Page(videoInfoData, pageInfo);
        try {
            page.download();
        } catch (e) {
            console.error(chalk.white.bold.bgRed(e));
        }
    }
};

if (require.main === module) {
    main(process.argv[2]);
} else {
    module.exports = { main }
}