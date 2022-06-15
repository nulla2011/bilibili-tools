import { httpGet } from "../utils";

const test = async ()=>{
  await httpGet({
    hostname: 'api.live.bilibili.com',
    port: 80,
    method: 'GET'
  })
}
test()