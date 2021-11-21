const util = require('./util.js');
const { Video } = require('./core/mainv.js');
const { Page } = require('./core/mainv.js');
const mainv = require('./core/mainv.js');

const main = async (input, dash = false, videoOn = 1, audioOn = 1) => {
    let line;
    if (input == undefined) {
        console.log("input link or BV or aid:");
        line = await util.readlineSync();
    } else {
        line = input;
    }
    let videoInfoData;
    try {
        videoInfoData = await mainv.getVideoInfo(line);
    }
    catch (e) {
        util.printErr(e);
        process.exit(1);
    }
    let video = new Video(videoInfoData);
    let pageInfo;
    video.showTitle();
    let pageNum = mainv.getPartNum(line);
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
            util.printErr("out of range");
        }
        pageInfo = video.pages[inp - 1];
    }
    let page = new Page(videoInfoData, pageInfo);
    if (dash) {
        page.enableDASH();
    }
    try {
        page.play(videoOn, audioOn);
    } catch (e) {
        util.printErr(e);
        process.exit(1);
    }
}

if (require.main === module) {
    main(process.argv[2]);
} else {
    module.exports = { main }
}
