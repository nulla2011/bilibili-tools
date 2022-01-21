import { getVideoInfo } from './core/video.js';
import * as fs from 'fs';
import notifier from 'node-notifier';

const normalInterval = 1 * 60 * 60 * 1000;
const testInterval = 1 * 60 * 1000;
const interval = testInterval;
interface videoDataForCompare {
  aid: number;
  videos: number;
  pic: string;
  title: string;
  desc: string;
  duration: number;
  cids: number[];
}
const getInfo = async (input: string) => {
  let d;
  try {
    d = await getVideoInfo(input);
  } catch (error) {
    console.error(error);
    notifier.notify(
      {
        title: "get info error!",
        message: "get info error!",
        sound: true
      }, (error, response) => {
        process.exit(0);
      });
  }
  let result: videoDataForCompare = {
    aid: d.aid,
    videos: d.videos,
    pic: d.pic,
    title: d.title,
    desc: d.desc,
    duration: d.duration,
    cids: d.pages.map(p => p.cid)
  }
  return result;
};
const compare = (a: videoDataForCompare, b: videoDataForCompare): boolean => {
  for (const k in a) {
    if (Array.isArray(a[k])) {
      if (a[k].length != a[k].length) {
        return false;
      }
      return a[k].every(i => a[k][i] === b[k][i]);
    } else {
      if (a[k] !== b[k]) {
        return false;
      }
    }
  }
  return true;
}
const diff = (a: videoDataForCompare, b: videoDataForCompare) => {
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
    } else {
      if (a[k] !== b[k]) {
        console.log(`${k}: ${a[k]} -> ${b[k]}`);
      }
    }
  }
}
const notifyChange = (text: string) => {
  notifier.notify({
    title: "Video changed!",
    message: text,
    sound: true
  });
}
const main = async (input: string) => {
  let info = await getInfo(input);
  let oldInfo: videoDataForCompare;
  try {
    oldInfo = JSON.parse(fs.readFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, 'utf-8'));
  } catch (e: any) {
    if (e.code === "ENOENT") {         //没有缓存
      console.error(`no cache for ${info.aid}`);
      oldInfo = info;
      try {
        fs.copyFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, `${__dirname}/../cache/videoinfo-${info.aid}.json.old`);
      } catch (e) { } finally {
        fs.writeFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
      }
    } else {
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
  setInterval(async () => {
    oldInfo = JSON.parse(fs.readFileSync(`${__dirname}/../cache/videoinfo-${info.aid}.json`, 'utf-8'));
    info = await getInfo(input);
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
  }, interval);
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
};

main(process.argv[2]);
