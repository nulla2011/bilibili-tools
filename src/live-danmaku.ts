import WebSocket from 'ws';
import decompress from 'Brotli/decompress';
import { Room, getRoomID } from './core/live';
import { formatTime, formatDate, printErr, session, uid } from './utils';
import axios from 'axios';
import assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

const DANMAKU_INFO = new URL('https://api.live.bilibili.com/xlive/web-room/v1/index/getDanmuInfo');
// const wsURL = new URL('wss://tx-gz-live-comet-04.chat.bilibili.com/sub'); //用别的 URL 会连不上？
const LOG_PATH =
  process.platform === 'win32' ? process.env.USERPROFILE + '/Documents/btools/' : '~/.btools/';

const getWs = async (id): Promise<[URL, string]> => {
  DANMAKU_INFO.searchParams.set('type', '0');
  DANMAKU_INFO.searchParams.set('id', id);
  let data = await axios
    .get(DANMAKU_INFO.href, {
      headers: {
        cookie: `SESSDATA=${session};`,
      },
    })
    .then((response) => response.data);
  if (data.code != 0) {
    throw new Error(`error code: ${data.code}, message: ${data.message}`);
  } else {
    let wsURL = new URL(
      'wss://' + data.data.host_list[0].host + ':' + data.data.host_list[0].wss_port + '/sub'
    );
    return [wsURL, data.data.token];
  }
};
interface IConfig {
  showR?: boolean;
}
const wsService = (roomid: number, URL: URL, token: string, config?: IConfig) => {
  let timer: NodeJS.Timer;
  let ws = new WebSocket(URL);
  let log_file = fs.createWriteStream(
    path.resolve(LOG_PATH, `${formatDate(new Date()).slice(2, 10)}-live-${roomid}.log`),
    {
      flags: 'a',
      encoding: 'utf8',
    }
  );
  let setVerifyData = (string: string) => {
    const encoder = new TextEncoder();
    let stringBuffer = encoder.encode(string);
    let buffer = new ArrayBuffer(stringBuffer.byteLength + 16);
    let view = new DataView(buffer);
    view.setUint32(0, stringBuffer.byteLength + 16);
    view.setUint16(4, 16);
    view.setUint16(6, 1);
    view.setUint32(8, 7);
    view.setUint32(12, 1);
    for (let i = 0; i < stringBuffer.byteLength; i++) {
      view.setUint8(16 + i, stringBuffer[i]);
    }
    return buffer;
  };
  ws.onopen = (e) => {
    console.log('opened');
    let verify = {
      uid,
      roomid,
      protover: 3,
      platform: 'web',
      type: 2,
      key: token,
    };
    ws.send(setVerifyData(JSON.stringify(verify)));
    timer = setInterval(() => {
      let buffer = new ArrayBuffer(16);
      let v = new DataView(buffer);
      v.setUint32(0, 0);
      v.setUint16(4, 16);
      v.setUint16(6, 1);
      v.setUint32(8, 2);
      v.setUint32(12, 1);
      ws.send(buffer);
    }, 30000);
  };
  ws.onerror = (e) => console.log(e);
  ws.onclose = (e) => {
    console.log(`[closed] ${e.code}: ${e.reason}`);
    if (!timer) clearInterval(timer);
    setTimeout(wsService, 4000);
  };
  ws.onmessage = (e) => {
    handleMessage(Buffer.from(e.data as ArrayBuffer));
  };
  const handleMessage = (buf: Buffer) => {
    let offset = 0;
    interface IResult {
      len: number;
      headLen: number;
      ver: number;
      type: number;
      num: number;
      body: string;
    }
    let result: IResult[] = [];
    let decoder = new TextDecoder();
    while (offset < buf.length) {
      let packetLen = buf.readUint32BE(offset + 0);
      let headLen = buf.readUint16BE(offset + 4);
      let packetVer = buf.readUint16BE(offset + 6);
      let packetType = buf.readUint32BE(offset + 8);
      let num = buf.readUint32BE(12);
      if (packetVer == 3) {
        let br = buf.subarray(offset + headLen, offset + packetLen);
        let decompressedBr = decompress(br);
        let view = new DataView(decompressedBr.buffer);
        let internalOffset = 0;
        while (internalOffset < decompressedBr.byteLength) {
          let packetLen = view.getUint32(internalOffset + 0);
          let headLen = view.getUint16(internalOffset + 4);
          let packetVer = view.getUint16(internalOffset + 6);
          let packetType = view.getUint32(internalOffset + 8);
          let num = view.getUint32(12);
          let decoder = new TextDecoder();
          let data = decoder.decode(
            new Uint8Array(decompressedBr.buffer, internalOffset + headLen, packetLen - headLen)
          );
          result.push({
            len: packetLen,
            headLen,
            ver: packetVer,
            type: packetType,
            num,
            body: data,
          });
          internalOffset += packetLen;
        }
      } else {
        let dataBuf = buf.subarray(offset + headLen, offset + packetLen);
        result.push({
          len: packetLen,
          headLen,
          ver: packetVer,
          type: packetType,
          num,
          body: packetType == 3 ? dataBuf.readUInt32BE().toString() : decoder.decode(dataBuf),
        });
      }
      offset += packetLen;
    }
    result.forEach((r) => {
      if (r.type == 3) {
        if (config?.showR) {
          console.log(`人气: ${r.body}`);
        }
      } else if (r.type == 8) {
        try {
          assert.equal(JSON.parse(r.body).code, 0);
        } catch (error) {
          console.log(`ERROR: ${JSON.parse(r.body)}`);
          process.exit(1);
        }
        console.log('Verify success');
      } else {
        let data = JSON.parse(r.body);
        // console.log(data);
        if (data.cmd == 'DANMU_MSG') {
          let time = new Date(data.info[9].ts * 1000);
          console.log(`[${formatTime(time)}] ${data.info[2][1]}: ${data.info[1]}`);
          log_file.write(`[${formatTime(time)}] ${data.info[2][1]}: ${data.info[1]}\n`);
        }
        if (data.cmd == 'INTERACT_WORD') {
          let time = new Date(data.data.timestamp * 1000);
          if (data.data.msg_type == 2) {
            console.log(`[${formatTime(time)}] ${data.data.uname} 关注了直播间`);
            log_file.write(`[${formatTime(time)}] ${data.data.uname} 关注了直播间\n`);
          } else {
            console.log(`[${formatTime(time)}] ${data.data.uname} 进入直播间`);
            log_file.write(`[${formatTime(time)}] ${data.data.uname} 进入直播间\n`);
          }
        }
        if (data.cmd == 'SEND_GIFT') {
          let time = new Date(data.data.timestamp * 1000);
          console.log(
            `[${formatTime(time)}] ${data.data.uname} ${data.data.action} ${data.data.giftName} x ${
              data.data.num
            }`
          );
          log_file.write(
            `[${formatTime(time)}] ${data.data.uname} ${data.data.action} ${data.data.giftName} x ${
              data.data.num
            }\n`
          );
        }
      }
    });
  };
};

export const main = async (input: string, config?: IConfig) => {
  let ID = getRoomID(input);
  let room = new Room(ID);
  let [wsURL, token] = await getWs(ID).catch((e) => {
    printErr(e);
    process.exit(1);
  });
  console.log(wsURL.href);
  await room.getInfo();
  wsService(room.room_id, wsURL, token, config);
};

if (require.main === module) {
  main(process.argv[2]);
}
