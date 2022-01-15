import { getRoomID, Room } from "../core/live.js";
import * as fs from 'fs';
import { formatDate, printErr, printWarn, printInfo } from "../util.js";
import notifier from 'node-notifier';
import { exec } from 'child_process';
import express from 'express';
import * as path from 'path';

interface ImonitRoom {
  id: number;
  isAlert: boolean;
  uname?: string;
  live_time?: string;
}
interface Ijson {
  [key: number]: ImonitRoom;
}
const monitorRoomsSettingPath = path.resolve(`${__dirname}/../monitor-rooms.json`);
const interval = 5 * 1000;

class MonitorRoom extends Room {
  private _isAlert: boolean;
  constructor(id) {
    super(id);
    this._isAlert = true;
  }
  public get isAlert() {
    return this._isAlert;
  }
  public setNoAlert() {
    this._isAlert = false;
  }
}
const addRoom = async (input: string, isAlert: boolean = true) => {
  let id = getRoomID(input);
  let jsonDATA: Ijson;
  try {
    jsonDATA = JSON.parse(fs.readFileSync(monitorRoomsSettingPath, 'utf-8'));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      printWarn("No config file");
      jsonDATA = {};
    } else {
      printErr("Unknown error");
      process.exit(0);
    }
  }
  if (jsonDATA.hasOwnProperty(id)) {
    printErr("room already exists!");
  } else {
    let newRoom = new MonitorRoom(id);
    await newRoom.getInfo();
    await newRoom.getUserInfo();
    let newMRoom: ImonitRoom = {
      id,
      isAlert: newRoom.isAlert,
      uname: newRoom.uname
    }
    jsonDATA[id] = newMRoom;
    fs.writeFileSync(monitorRoomsSettingPath, JSON.stringify(jsonDATA, null, 2), 'utf-8');
    printInfo("add success");
  }
};
const alertLives = async (roomList: MonitorRoom[]) => {
  for (const room of roomList) {
    room.isAlert && await alertLive(room);
  }
};
const alertLive = (room: MonitorRoom) => {
  return new Promise((resolve) => {
    notifier.notify({
      title: `${room.uname} ls live!`,
      message: room.title,
      sound: true,
      actions: ['watch', 'cancel']
    }, (error, response) => {
      if (error) console.error(error);
      if (response == 'timeout') {
        notifier.removeAllListeners();
        resolve(null);
      }
    });
    notifier.once('watch', () => {
      exec(`start https://live.bilibili.com/${room.id}`);
      notifier.removeAllListeners();
      resolve(null);
    });
    notifier.once('cancel', () => {
      notifier.removeAllListeners();
      resolve(null);
    });
  });
};
const list2html = (list: MonitorRoom[]) => {
  let html = fs.readFileSync(`${__dirname}/../templates/liveRooms.html`, 'utf-8');
  list.sort((r1, r2) => new Date(r2.live_time).getTime() - new Date(r1.live_time).getTime());
  let content = list.reduce((c: string, r) => {
    return c +
      `<div class="room">\
      <a href='https://live.bilibili.com/${r.id}' target="_blank">\
      <div class="face"><img src="https://images.weserv.nl/?url=${r.uface}@60w_60h.webp"/></div>\
      <div class="text">\
      <div class="name">${r.uname}</div>\
      <div class="title">${r.title}</div>\
      <div class="online"><span></span><span>${r.online}</span></div>\
      <div class="time">started at: ${r.live_time}</div>\
      </div></a></div>`;
  }, '');
  let insertIndex = html.search('</main>') - 1;
  return html.slice(0, insertIndex) + content + html.slice(insertIndex);
};
async function monitor() {
  let monitorList: Ijson;
  try {
    monitorList = JSON.parse(fs.readFileSync(monitorRoomsSettingPath, 'utf-8'));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.error("No config file");
    } else {
      console.error("Unknown error");
    }
    process.exit(0);
  }
  //init rooms start
  let roomList: MonitorRoom[] = [];
  let liveRoomList: MonitorRoom[] = [];
  for (const id in monitorList) {
    let room = new MonitorRoom(id);
    monitorList[id].isAlert || room.setNoAlert();
    await room.getInfo();
    if (room.live_status == 1) {
      await room.getUserInfo();
      console.log(`${room.uname} is live since ${room.live_time}`);
      liveRoomList.push(room);
    }
    roomList.push(room);
  }
  //init rooms end
  const app = express();
  app.get('/', (req, res) => {
    res.append('Content-Type', 'text/html');
    res.send(list2html(liveRoomList));
  });
  app.get('/index.css', (req, res) => {
    res.append('Content-Type', 'text/css');
    res.sendFile(path.resolve(`${__dirname}/../templates/liveRooms.css`));
  });
  app.get('/live-online.svg', (req, res) => {
    res.append('Content-Type', 'image/svg+xml');
    res.sendFile(path.resolve(`${__dirname}/../templates/live-online.svg`));
  });
  app.listen(1173);
  alertLives(liveRoomList);
  setInterval(() => {
    roomList.forEach(async room => {
      let oldStatus = room.live_status;
      await room.getInfo();
      if (room.live_status !== oldStatus) {
        await room.getUserInfo();
        if (room.live_status == 1) {
          console.log(`[${formatDate(new Date())}] ${room.uname} is live!`);
          liveRoomList.push(room);
          room.isAlert && await alertLive(room);
        } else if (oldStatus == 1) {
          console.log(`[${formatDate(new Date())}] ${room.uname} just stopped live!`);
          let i = liveRoomList.findIndex((e) => e.id === room.id);
          i != -1 && liveRoomList.splice(i, 1);
          notifier.notify({
            title: `${room.uname} just stopped live!`,
            message: `，，，`,
            sound: true
          });
        }
      }
    });
  }, interval);
};

if (process.argv[2] == "-a") {
  try {
    addRoom(process.argv[3]);
  } catch (error) {
    printErr("add error!");
  }
} else {
  monitor();
}