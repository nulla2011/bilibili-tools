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
const express_1 = __importDefault(require("express"));
const path = __importStar(require("path"));
const monitorRoomsSettingPath = path.resolve(`${__dirname}/../monitor-rooms.json`);
const interval = 5 * 1000;
class MonitorRoom extends live_js_1.Room {
    constructor(id) {
        super(id);
        this._isAlert = true;
    }
    get isAlert() {
        return this._isAlert;
    }
    setNoAlert() {
        this._isAlert = false;
    }
}
const addRoom = (input, isAlert = true) => __awaiter(void 0, void 0, void 0, function* () {
    let id = (0, live_js_1.getRoomID)(input);
    let jsonDATA;
    try {
        jsonDATA = JSON.parse(fs.readFileSync(monitorRoomsSettingPath, 'utf-8'));
    }
    catch (error) {
        if (error.code === "ENOENT") {
            (0, util_js_1.printWarn)("No config file");
            jsonDATA = {};
        }
        else {
            (0, util_js_1.printErr)("Unknown error");
            process.exit(0);
        }
    }
    if (jsonDATA.hasOwnProperty(id)) {
        (0, util_js_1.printErr)("room already exists!");
    }
    else {
        let newRoom = new MonitorRoom(id);
        yield newRoom.getInfo();
        yield newRoom.getUserInfo();
        let newMRoom = {
            id,
            isAlert: newRoom.isAlert,
            uname: newRoom.uname
        };
        jsonDATA[id] = newMRoom;
        fs.writeFileSync(monitorRoomsSettingPath, JSON.stringify(jsonDATA, null, 2), 'utf-8');
        (0, util_js_1.printInfo)("add success");
    }
});
const alertLives = (roomList) => __awaiter(void 0, void 0, void 0, function* () {
    for (const room of roomList) {
        room.isAlert && (yield alertLive(room));
    }
});
const alertLive = (room) => {
    return new Promise((resolve) => {
        node_notifier_1.default.notify({
            title: `${room.uname} ls live!`,
            message: room.title,
            sound: true,
            actions: ['watch', 'cancel']
        }, (error, response) => {
            if (error)
                console.error(error);
            if (['timeout', 'activate', 'dismissed'].includes(response)) {
                node_notifier_1.default.removeAllListeners();
                resolve(null);
            }
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
const list2html = (list) => {
    let html = fs.readFileSync(`${__dirname}/../templates/liveRooms.html`, 'utf-8');
    list.sort((r1, r2) => new Date(r2.live_time).getTime() - new Date(r1.live_time).getTime());
    let content = list.reduce((c, r) => {
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
function monitor() {
    return __awaiter(this, void 0, void 0, function* () {
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
        let liveRoomList = [];
        for (const id in monitorList) {
            let room = new MonitorRoom(id);
            monitorList[id].isAlert || room.setNoAlert();
            yield room.getInfo();
            if (room.live_status == 1) {
                yield room.getUserInfo();
                console.log(`${room.uname} is live since ${room.live_time}`);
                liveRoomList.push(room);
            }
            roomList.push(room);
        }
        //init rooms end
        const app = (0, express_1.default)();
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
            roomList.forEach((room) => __awaiter(this, void 0, void 0, function* () {
                let oldStatus = room.live_status;
                yield room.getInfo();
                if (room.live_status !== oldStatus) {
                    yield room.getUserInfo();
                    if (room.live_status == 1) {
                        console.log(`[${(0, util_js_1.formatDate)(new Date())}] ${room.uname} is live!`);
                        liveRoomList.push(room);
                        room.isAlert && (yield alertLive(room));
                    }
                    else if (oldStatus == 1) {
                        console.log(`[${(0, util_js_1.formatDate)(new Date())}] ${room.uname} just stopped live!`);
                        let i = liveRoomList.findIndex((e) => e.id === room.id);
                        i != -1 && liveRoomList.splice(i, 1);
                        node_notifier_1.default.notify({
                            title: `${room.uname} just stopped live!`,
                            message: `，，，`,
                            sound: true
                        });
                    }
                }
            }));
        }, interval);
    });
}
;
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
