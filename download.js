const util = require('./util.js');
const { Video } = require('./core/mainv.js');
const { Page } = require('./core/mainv.js');
const mainv = require('./core/mainv.js');

const main = async (input, path = util.config.dlPath, title, dash = false, videoOn = 1, audioOn = 1) => {
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
        if (title) {
            console.log(`change title to ${title}, continue? (y/n)`);
            line = await util.readlineSync();
            if (line == 'y') {
                page.title = title;
            }
        }
        if (dash) {
            page.enableDASH();
        }
        try {
            page.download(path, videoOn, audioOn);
        } catch (e) {
            util.printErr(e);
        }
    }
};

if (require.main === module) {
    main(process.argv[2]);
} else {
    module.exports = { main }
}