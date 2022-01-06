import { getRoomID, Room } from "../core/live.js";
import * as fs from "fs";
import { printErr, printWarn } from "../util.js";
import notifier from 'node-notifier';

interface monRoom {
  id: number;
  isAlert: boolean;
  description?: string;
}
const monitorRoomsPath = "./monitor-rooms.json";
const interval = 5 * 1000;

const addRoom = (input: string, isAlert: boolean = true) => {
  let newroom: monRoom = {
    id: getRoomID(input),
    isAlert
  }
  let jsonData: monRoom[];
  try {
    jsonData = JSON.parse(fs.readFileSync(monitorRoomsPath, 'utf-8'));
  } catch (error: any) {
    if (error.code == "ENOENT") {
      printWarn("No config file");
      jsonData = [];
    } else {
      printErr("Unknown error");
      process.exit(0);
    }
  }
  if (jsonData.some(i => i.id == newroom.id)) {
    printErr("room already exists!");
  } else {
    jsonData.push(newroom);
    fs.writeFileSync(monitorRoomsPath, JSON.stringify(jsonData), 'utf-8');
  }
}
interface monitorRoom extends Room {
  isAlert: boolean;
}
class monitorRoom extends Room {
  constructor(r: monRoom) {
    super(r.id);
    this.isAlert = r.isAlert;
  }
}
const monitor = () => {
  let monitorList: monRoom[];
  try {
    monitorList = JSON.parse(fs.readFileSync(monitorRoomsPath, 'utf-8'));
  } catch (error: any) {
    if (error.code == "ENOENT") {
      console.error("No config file");
    } else {
      console.error("Unknown error");
    }
    process.exit(0);
  }
  let roomList: monitorRoom[] = [];
  monitorList.forEach(async r => {
    let room = new monitorRoom(r);
    await room.getInfo();
    if (room.live_status == 1) {
      console.log(`[${new Date().toString().replace(' (中国标准时间)', '')}] ${room.id} is live!`);
      if (room.isAlert) {
        notifier.notify({
          title: `${room.id} ls live!`,
          message: room.title,
          sound: true
        });
      }
    }
    roomList.push(room);
  });    //init rooms
  setInterval(() => {
    roomList.forEach(async room => {
      let oldStatus = room.live_status;
      await room.getInfo();
      // if (room.live_status == 1) {
      //   console.log(`${room.id} is live!`);
      //   if (room.live_status !== oldStatus) {

      //     if (room.isAlert) {
      //       notifier.notify({
      //         title: `${room.id} ls live!`,
      //         message: room.title,
      //         sound: true
      //       });
      //     }
      //   }
      // } else if (room.live_status !== oldStatus && oldStatus == 1) {
      //   console.log(`${room.id} just stopped live!`);
      //   notifier.notify({
      //     title: `${room.id} just stopped live!`,
      //     message: `,,,`,
      //     sound: true
      //   });
      // }
      if (room.live_status !== oldStatus) {
        if (room.live_status == 1) {
          console.log(`[${new Date().toString().replace(' (中国标准时间)', '')}] ${room.id} is live!`);
          if (room.isAlert) {
            notifier.notify({
              title: `${room.id} ls live!`,
              message: room.title,
              sound: true
            });
          }
        } else if (oldStatus == 1) {
          console.log(`[${new Date().toString().replace(' (中国标准时间)', '')}] ${room.id} just stopped live!`);
          notifier.notify({
            title: `${room.id} just stopped live!`,
            message: `,,,`,
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