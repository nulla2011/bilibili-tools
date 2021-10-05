const exec = require('child_process').exec;
const chalk = require('chalk');
const util = require('./util.js');
const cookie = require('./util.js').cookie;

const arg = process.argv[2];
const main = async () => {
    let line;
    if (arg == undefined) {
        console.log("input link or BV or aid:");
        line = await util.readlineSync();
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
    let playInfo;
    console.log(chalk.bold.white(videoInfo.title));
    if (videoInfo.videos === 1) {
        playInfo = { page: 1, cid: videoInfo.pages[0].cid, part: videoInfo.pages[0].part };
        console.log("only 1 part, playing..");
    } else {
        for (let item of videoInfo.pages) {
            console.log(item.page.toString().padStart(2, '0'), item.part);
        }
        console.log(videoInfo.videos + " parts, which do you want?");
        let inp = await util.readlineSync();
        if (inp > videoInfo.pages) {
            console.error(chalk.white.bold.bgRed("out of range"));
            process.exit(1);
        } else {
            playInfo = { page: inp, cid: videoInfo.pages[inp - 1].cid, part: videoInfo.pages[inp - 1].part };
        }
    }
    let dlUrl;
    try {
        dlUrl = await util.getPlayurl(videoInfo.aid, playInfo.cid, cookie);
    } catch (e) {
        console.error(chalk.white.bold.bgRed(e));
        process.exit(1);
    }
    console.log(util.showQuality(dlUrl));    //low quality warning
    //console.log(dlUrl);
    let cmdString = `mpv --no-ytdl --referrer="https://www.bilibili.com" "${dlUrl}"`;
    exec(cmdString,(err,stdout,stderr)=>{
        if(err){
            console.error(chalk.white.bold.bgRed(err));
        }else{
            console.log(stdout);
        }
    });
}

main();