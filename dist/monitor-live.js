"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const live_js_1 = require("../core/live.js");
const fs = __importStar(require("fs"));
const util_js_1 = require("../util.js");
const node_notifier_1 = __importDefault(require("node-notifier"));
const child_process_1 = require("child_process");
const monitorRoomsSettingPath = `${__dirname}/../monitor-rooms.json`;
const interval = 5 * 1000;
class MonitorRoom extends live_js_1.Room {
    constructor(r) {
        super(r.id);
        this._isAlert = r.isAlert;
    }
    get isAlert() {
        return this._isAlert;
    }
}
const addRoom = (input, isAlert = true) => __awaiter(void 0, void 0, void 0, function* () {
    let newroom = {
        id: (0, live_js_1.getRoomID)(input),
        isAlert
    };
    let jsonData;
    try {
        jsonData = JSON.parse(fs.readFileSync(monitorRoomsSettingPath, 'utf-8'));
    }
    catch (error) {
        if (error.code === "ENOENT") {
            (0, util_js_1.printWarn)("No config file");
            jsonData = [];
        }
        else {
            (0, util_js_1.printErr)("Unknown error");
            process.exit(0);
        }
    }
    if (jsonData.some(i => i.id == newroom.id)) {
        (0, util_js_1.printErr)("room already exists!");
    }
    else {
        let newRoomI = new MonitorRoom(newroom);
        yield newRoomI.getUserInfo();
        newroom.uname = newRoomI.uname;
        jsonData.push(newroom);
        fs.writeFileSync(monitorRoomsSettingPath, JSON.stringify(jsonData, null, 2), 'utf-8');
        (0, util_js_1.printInfo)("add success");
    }
});
const alertLive = (room) => {
    return new Promise((resolve) => {
        node_notifier_1.default.notify({
            title: `${room.uname} ls live!`,
            message: room.title,
            sound: true,
            actions: ['watch', 'cancel']
        });
        node_notifier_1.default.once('watch', () => {
            (0, child_process_1.exec)(`start https://live.bilibili.com/${room.id}`);
            node_notifier_1.default.removeAllListeners();
            resolve(null);
        });
        node_notifier_1.default.once('cancel', () => {
            node_notifier_1.default.removeAllListeners();
            resolve(null);
        });
    });
};
const monitor = () => __awaiter(void 0, void 0, void 0, function* () {
    let monitorList;
    try {
        monitorList = JSON.parse(fs.readFileSync(monitorRoomsSettingPath, 'utf-8'));
    }
    catch (error) {
        if (error.code === "ENOENT") {
            console.error("No config file");
        }
        else {
            console.error("Unknown error");
        }
        process.exit(0);
    }
    //init rooms start
    let roomList = [];
    for (const r of monitorList) {
        let room = new MonitorRoom(r);
        yield room.getInfo();
        if (room.live_status == 1) {
            yield room.getUserInfo();
            console.log(`${room.uname} is live since ${room.live_time}`);
            room.isAlert && (yield alertLive(room));
        }
        roomList.push(room);
    }
    //init rooms end
    setInterval(() => {
        roomList.forEach((room) => __awaiter(void 0, void 0, void 0, function* () {
            let oldStatus = room.live_status;
            yield room.getInfo();
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
                yield room.getUserInfo();
                if (room.live_status == 1) {
                    console.log(`[${(0, util_js_1.formatDate)(new Date())}] ${room.uname} is live!`);
                    room.isAlert && (yield alertLive(room));
                }
                else if (oldStatus == 1) {
                    console.log(`[${(0, util_js_1.formatDate)(new Date())}] ${room.uname} just stopped live!`);
                    node_notifier_1.default.notify({
                        title: `${room.uname} just stopped live!`,
                        message: `,,,`,
                        sound: true
                    });
                }
            }
        }));
    }, interval);
});
if (process.argv[2] == "-a") {
    try {
        addRoom(process.argv[3]);
    }
    catch (error) {
        (0, util_js_1.printErr)("add error!");
    }
}
else {
    monitor();
}
