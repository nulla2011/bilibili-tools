import axios from 'axios';

const BANGUMI_INFO_API = new URL('http://api.bilibili.com/pgc/view/web/season');

function formatSSID(input: string): number {
  let m = input.match(/^\d+$/);
  let ssid: any = m ? m[0] : input.match(/www\.bilibili\.com\/bangumi\/play\/ss(\d+)/)?.[1];
  if (!ssid) throw "input illegal";
  return ssid as number;
}

class Bangumi {
  ssid: number;
  aidList!: number[];
  views!: number;
  favorites!: number;
  reply!: number;
  coins!: number;
  share!: number;
  danmakus!: number;
  constructor(ssid: number) {
    this.ssid = ssid;
  }
  public async getStat() {
    let response = await axios.get(BANGUMI_INFO_API.href, {
      params: {
        season_id: this.ssid
      }
    });
    let stat = response.data.result.stat;
    Object.assign(this, {
      views: stat.views,  //播放
      favorites: stat.favorites,  //追番
      reply: stat.reply,
      coins: stat.coins,
      share: stat.share,
      danmakus: stat.danmakus,
    });
  }
  public async getAids() {
    let response = await axios.get(BANGUMI_INFO_API.href, {
      params: {
        season_id: this.ssid
      }
    });
    this.aidList = response.data.result.episodes.sort((e1, e2) => parseInt(e1.title) - parseInt(e2.title)).map(ep => ep.aid);
  }
}

export { formatSSID, Bangumi }