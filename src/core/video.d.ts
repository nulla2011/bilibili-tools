declare namespace video {
  function getVideoInfo(input: string): object;
}
declare class Video {
  view: number;
  like: number;
  coin: number;
  favorite: number;
  share: number;
  reply: number;
  danmaku: number;
  constructor(data);
  getStat();
}

export { getVideoInfo, Video };