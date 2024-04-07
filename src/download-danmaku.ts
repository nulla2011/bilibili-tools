import { Video, Page, getVideoInfo, getPartNum } from './core/video';
import util from './utils';

export const main = async (input: string, path = util.config.dlPath) => {
  let videoInfoData;
  try {
    videoInfoData = await getVideoInfo(input);
  } catch (e) {
    util.printErr(e);
    process.exit(1);
  }
  let video = new Video(videoInfoData);
  video.showTitle();
  let pageNum = getPartNum(input);
  let dlList: Record<string, any>[] = [];
  if (video.videos === 1) {
    dlList = video.pages;
    console.log('only 1 part, downloading..');
  } else if (pageNum) {
    dlList = [video.pages[pageNum - 1]];
    console.log('page number has been inputed, downloading..');
  } else {
    for (let item of video.pages) {
      console.log(item.page.toString().padStart(2, '0'), item.part);
    }
    console.log(video.videos + ' parts, which do you want?');
    let inp = await util.readlineSync();
    if (inp == '') {
      dlList = video.pages;
    } else {
      for (let i of inp.split(/[ ,]/)) {
        dlList.push(video.pages[i - 1]);
      }
    }
  }
  for (let pageInfo of dlList) {
    let page = new Page(videoInfoData, pageInfo);
    try {
      page.downloadDanmaku(path);
    } catch (e) {
      util.printErr(e);
    }
  }
};

if (require.main === module) {
  main(process.argv[2]);
}
