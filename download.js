const spawn = require('child_process').spawn;
const chalk = require('chalk');
const util = require('./util.js');
const cookie=require('./util.js').cookie;
const dlPath=require('./util.js').settings.dlPath;

const arg = process.argv[2];

const main = async () => {
    let line;
    if (arg == undefined) {
        console.log("input link or BV or aid:");
        line = await util.readlineSync();
        //let line = "BV1234y1D71H";
    } else {
        line = arg;
    }
    let videoInfo;
    try {
        videoInfo = await util.getVideoInfo(line);
    }
    catch (e) {
        console.error(chalk.white.bold.bgRed(e));
        process.exit(1);
    }
    let dlList = [];
    console.log(chalk.bold.white(videoInfo.title));
    if (videoInfo.videos === 1) {
        dlList = [{ page: 1, cid: videoInfo.pages[0].cid, part: videoInfo.pages[0].part }];
        console.log("only 1 part, downloading..");
    } else {
        for (let item of videoInfo.pages) {
            console.log(item.page.toString().padStart(2, '0'), item.part);
        }
        console.log(videoInfo.videos + " parts, which do you want?");
        let inp = await util.readlineSync();
        if (inp == '') {
            dlList = videoInfo.pages;
        } else {
            for (let i of inp.split(/[ ,]/)) {
                dlList.push({ page: i, cid: videoInfo.pages[i - 1].cid, part: videoInfo.pages[i - 1].part })
            }
        }
    }
    for (let item of dlList) {
        let dlUrl;
        try {
            dlUrl = await util.getPlayurl(videoInfo.aid, item.cid, cookie);
        } catch (e) {
            console.error(chalk.white.bold.bgRed(e));
            process.exit(1);
        }
        console.log(`P${item.page}: ${util.showQuality(dlUrl)}`);    //low quality warning
        //console.log(dlUrl);
        let fileName = `${videoInfo.aid} - ${videoInfo.title}.flv`;
        if (videoInfo.videos > 1) {
            fileName = fileName.slice(0, -4) + `_p${item.page}_${item.part}.flv`;
        }
        var dlTask = spawn("aria2c", ['-s', '16', '-x', '16', '--check-certificate=false', '--referer=https://www.bilibili.com', dlUrl, '-d', dlPath, '-o', fileName]);
        dlTask.stdout.on('data', (data) => {
            if (data) {
                console.log(`P${item.page}: ${data}`);
            }
        });
        dlTask.stderr.on('data', (data) => {
            console.log(`stderr: ${data}`);
        });
        dlTask.on("close", (code) => {
            console.log(`child process ${item.page} exited with code ${code}`);
        });
    }
};

main();