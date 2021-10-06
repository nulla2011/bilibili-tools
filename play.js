const chalk = require('chalk');
const util = require('./util.js');
const { Video } = require('./util.js');
const { Page } = require('./util.js');

const arg = process.argv[2];

const main = async () => {
    let line;
    if (arg == undefined) {
        console.log("input link or BV or aid:");
        line = await util.readlineSync();
    } else {
        line = arg;
    }
    let videoInfoData;
    try {
        videoInfoData = await util.getVideoInfo(line);
    }
    catch (e) {
        console.error(chalk.white.bold.bgRed(e));
        process.exit(1);
    }
    let video = new Video(videoInfoData[0]);
    let pageInfo;
    video.showTitle();
    pageNum = videoInfoData[1];
    if (video.videos === 1) {
        pageInfo = video.pages[0];
        console.log("only 1 part, playing..");
    } else if (pageNum) {
        pageInfo = video.pages[pageNum - 1];
        console.log("page number has been inputed");
    } else {
        for (let item of video.pages) {
            console.log(item.page.toString().padStart(2, '0'), item.part);
        }
        console.log(video.videos + " parts, which do you want?");
        let inp;
        while (true) {
            inp = await util.readlineSync();
            if (!(inp > video.videos || inp < 1)) { break; }
            console.error(chalk.white.bold.bgRed("out of range"));
        }
        pageInfo = video.pages[inp - 1];
    }
    let page = new Page(videoInfoData[0], pageInfo);
    try {
        page.play();
    } catch (e) {
        console.error(chalk.white.bold.bgRed(e));
        process.exit(1);
    }
}

main();