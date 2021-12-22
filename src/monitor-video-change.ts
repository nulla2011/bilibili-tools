import { getVideoInfo } from '../core/mainv.js';
import * as fs from 'fs';
import * as util from "../util.js";
import { exec } from "child_process";

const interval = 1 * 60 * 60 * 1000;
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
  let d = await getVideoInfo(input);
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
const main = async (input: string) => {
  let info = await getInfo(input);
  let oldInfo: videoDataForCompare;
  try {
    oldInfo = JSON.parse(fs.readFileSync(`./cache/videoinfo-${info.aid}.json`, 'utf-8'));
  } catch (e: any) {
    if (e.code === "ENOENT") {         //没有缓存
      console.error(`no cache for ${info.aid}`);
      oldInfo = info;
      try {
        fs.copyFileSync(`./cache/videoinfo-${info.aid}.json`, `./cache/videoinfo-${info.aid}.json.old`);
      } catch (e) { } finally {
        fs.writeFileSync(`./cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
      }
    } else {
      console.error("Unknown error");
      process.exit(0);
    }
  }
  if (!compare(info, oldInfo)) {
    console.log("changed!");
    util.alarm();
    exec(`msg %username% "video ${info.title} changed!"`);
  }
  fs.writeFileSync(`./cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
  setInterval(async () => {
    oldInfo = JSON.parse(fs.readFileSync(`./cache/videoinfo-${info.aid}.json`, 'utf-8'));
    info = await getInfo(input);
    if (!compare(info, oldInfo)) {
      console.log("changed!");
      util.alarm();
      exec(`msg %username% "video ${info.title} changed!"`);
    }
    else {
      console.log("no change");
    }
    fs.writeFileSync(`cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
  }, interval);
  process.on('SIGINT', () => {
    console.log('exit');
    fs.writeFileSync(`cache/videoinfo-${info.aid}.json`, JSON.stringify(info, null, 2));
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
