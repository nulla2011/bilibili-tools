import { formatSSID, Bangumi } from './core/bangumi';
import { Video, getVideoInfo } from './core/video';
import * as fs from 'fs';
import * as path from 'path';
import schedule from 'node-schedule';
import { formatDate } from './utils';

function notifyErrot(err) {

}
function initStatData(ssid) {
  let dataPath = path.resolve(`${__dirname}/../bangumi_stats/${ssid}.json`);
  try {
    return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  } catch (e: any) {
    if (e.code === "ENOENT") {
      console.error(`no data for ${ssid}, create`);
      try {
        fs.copyFileSync(dataPath, dataPath + '.old');
      } catch (e) { } finally {
        return [];
      }
    } else {
      console.error("Unknown error");
      process.exit(0);
    }
  }
}
async function main(input) {
  if (!input) {
    console.log(`usage:\n\
node dist/stat-bangumi-every-day.js [ssid or season url (for example: https://www.bilibili.com/bangumi/play/ss40264)]\n\
using pm2 is recommended:\n\
pm2 start dist/stat-bangumi-every-day.js -f -- [ssid]`);
    process.exit(0);
  }
  let ssid;
  try {
    ssid = formatSSID(input);
  } catch (e) {
    console.error(e);
    process.exit(0);
  }
  let JSONDATA = initStatData(ssid);
  let bgm = new Bangumi(ssid);
  try {
    await bgm.getAids();
  } catch (error) {
    //notify?
    process.exit(0);
  }
  let rule = new schedule.RecurrenceRule();
  // rule.hour=[11,23];
  rule.minute = [0, 20, 40];
  // rule.second = [0, 10, 20, 30, 40, 50];  //test rule
  schedule.scheduleJob(rule, async () => {
    await bgm.getStat();
    // await bgm.getAids();     //更新时间一定在没启动的时候吗？
    let videoStats: Object = {};
    for (const [i, aid] of bgm.aidList.entries()) {
      let video = new Video(await getVideoInfo(aid.toString()));
      videoStats[i + 1] = {
        aid,
        view: video.view,
        like: video.like,
        coin: video.coin,
        favorite: video.favorite,
        share: video.share,
        reply: video.reply,
        danmaku: video.danmaku,
      };
    }
    let time = formatDate(new Date());
    JSONDATA.push({
      time,
      stat: {
        views: bgm.views,
        favorites: bgm.favorites,
        reply: bgm.reply,
        coins: bgm.coins,
        share: bgm.share,
        danmakus: bgm.danmakus,
      },
      episode_stats: videoStats,
    });
    try {
      fs.writeFileSync(path.resolve(`${__dirname}/../bangumi_stats/${ssid}.json`), JSON.stringify(JSONDATA));
      console.log(`[${time}] write success!`);
    } catch (error) {
      console.error(error);
    }
  });
}

main(process.argv?.[2]);