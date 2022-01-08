import { getRoomID, Room } from "../core/live.js";
import * as fs from "fs";
import { formatDate, printErr, printWarn, printInfo } from "../util.js";
import notifier from 'node-notifier';
import { exec } from "child_process";

interface monRoom {
  id: number;
  isAlert: boolean;
  uname?: string;
  live_time?: string;
}
interface Ijson {
  [key: number]: monRoom;
}
const monitorRoomsSettingPath = `${__dirname}/../monitor-rooms.json`;
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
  let jsonData: Ijson;
  try {
    jsonData = JSON.parse(fs.readFileSync(monitorRoomsSettingPath, 'utf-8'));
  } catch (error: any) {
    if (error.code === "ENOENT") {
      printWarn("No config file");
      jsonData = {};
    } else {
      printErr("Unknown error");
      process.exit(0);
    }
  }
  if (jsonData.hasOwnProperty(id)) {
    printErr("room already exists!");
  } else {
    let newRoom = new MonitorRoom(id);
    await newRoom.getInfo();
    await newRoom.getUserInfo();
    let newMRoom: monRoom = {
      id,
      isAlert: newRoom.isAlert,
      uname: newRoom.uname
    }
    jsonData[id] = newMRoom;
    fs.writeFileSync(monitorRoomsSettingPath, JSON.stringify(jsonData, null, 2), 'utf-8');
    printInfo("add success");
  }
}
const alertLive = (room: MonitorRoom) => {
  return new Promise((resolve) => {
    notifier.notify({
      title: `${room.uname} ls live!`,
      message: room.title,
      sound: true,
      actions: ['watch', 'cancel']
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
  })
}
const monitor = async () => {
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
  for (const id in monitorList) {
    let room = new MonitorRoom(id);
    monitorList[id].isAlert || room.setNoAlert();
    await room.getInfo();
    if (room.live_status == 1) {
      await room.getUserInfo();
      console.log(`${room.uname} is live since ${room.live_time}`);
      room.isAlert && await alertLive(room);
    }
    roomList.push(room);
  }
  //init rooms end
  setInterval(() => {
    roomList.forEach(async room => {
      let oldStatus = room.live_status;
      await room.getInfo();
      if (room.live_status !== oldStatus) {
        await room.getUserInfo();
        if (room.live_status == 1) {
          console.log(`[${formatDate(new Date())}] ${room.uname} is live!`);
          room.isAlert && await alertLive(room);
        } else if (oldStatus == 1) {
          console.log(`[${formatDate(new Date())}] ${room.uname} just stopped live!`);
          notifier.notify({
            title: `${room.uname} just stopped live!`,
            message: `，，，`,
            sound: true
          });
        }
      }
    });
  }, interval);
}

if (process.argv[2] == "-a") {
  try {
    addRoom(process.argv[3]);
  } catch (error) {
    printErr("add error!");
  }
} else {
  monitor();
}