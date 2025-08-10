import md5 from "md5";
import axios from "axios";
import {session, UA} from "../utils";

const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
  61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
  36, 20, 34, 44, 52
]

const NAV_URL = 'https://api.bilibili.com/x/web-interface/nav'

const getMixinKey = (orig: string) =>
  mixinKeyEncTab.map((n) => orig[n]).join("").slice(0, 32);
const getWbiKeys = async () => {
  const res = await axios.get(NAV_URL, {
    headers: {
      Cookie: `SESSDATA=${session}`,
      'User-Agent': UA,
      Referer: 'https://www.bilibili.com/'
    }
  }).then(res => res.data);
  const {img_url, sub_url}: { img_url: string; sub_url: string } = res.data.wbi_img;
  return {
    img_key: img_url.slice(
      img_url.lastIndexOf('/') + 1,
      img_url.lastIndexOf('.')
    ),
    sub_key: sub_url.slice(
      sub_url.lastIndexOf('/') + 1,
      sub_url.lastIndexOf('.')
    )
  }
}
const encWbi = (
  params: URLSearchParams,
  img_key: string,
  sub_key: string
) => {
  const mixin_key = getMixinKey(img_key + sub_key),
    curr_time = Math.round(Date.now() / 1000),
    chr_filter = /[!'()*]/g;
  params.append('wts', curr_time.toString())
  // 按照 key 重排参数
  params.sort()
  const wbi_sign = md5(params.toString().replace(chr_filter, "") + mixin_key);
  params.append('w_rid', wbi_sign)
  return params
}

export default async (params: URLSearchParams) => {
  const web_keys = await getWbiKeys()
  const query = encWbi(params, web_keys.img_key, web_keys.sub_key)
  return query
}