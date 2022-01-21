import { getVideoInfo } from './core/video.js';

interface video {
  pubdate: number;
  ctime: number;
}
(async () => {
  let vdata = await getVideoInfo(process.argv[2]);
  let times: video = {
    pubdate: vdata.pubdate,
    ctime: vdata.ctime
  }
  if (times.pubdate === times.ctime) {
    console.log("match");

  } else {
    console.log(new Date(times.pubdate * 1000).toLocaleString(), new Date(times.ctime * 1000).toLocaleString());

  }
})()