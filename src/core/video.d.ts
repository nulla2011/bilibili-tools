// declare namespace video {
function getVideoInfo(input: string): Promise<any>;
function getPartNum(input: string): number | void;
// }
declare class Video {
  view: number;
  like: number;
  coin: number;
  favorite: number;
  share: number;
  reply: number;
  danmaku: number;
  videos: number;
  pages: Record<string, any>[];
  constructor(data);
  showTitle: () => void;
}
declare class Page extends Video {
  constructor(vdata, pdata);
  cid: string;
  downloadDanmaku: (path: string, xml?: boolean) => void;
}

export { getVideoInfo, getPartNum, Video, Page };
