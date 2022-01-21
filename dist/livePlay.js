"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const util = require('./utils');
const { Room } = require('./core/live.js');
const live = require('./core/live.js');
const main = (arg, isHLS, quality) => __awaiter(void 0, void 0, void 0, function* () {
    let line;
    if (arg == undefined) {
        console.log("input link or room id:");
        line = yield util.readlineSync();
    }
    else {
        line = arg;
    }
    let roomID;
    try {
        roomID = yield live.getRoomID(line);
    }
    catch (e) {
        util.printErr(e);
        process.exit(1);
    }
    let room = new Room(roomID);
    try {
        yield room.getInfo();
    }
    catch (e) {
        util.printErr(e);
        process.exit(1);
    }
    util.printInfo(`标题：${room.title}\n人气：${room.online}\n开播时间：${room.live_time}\n分区：${room.parent_area_name} - ${room.area_name}`);
    if (!(isHLS == undefined || isHLS == null)) {
        room.isHLS = isHLS;
    }
    if (room.live_status != 1) {
        util.printErr("not streaming!");
        process.exit();
    }
    else {
        yield room.getQualities();
        if (quality == undefined || quality == null) {
            quality = Math.max(...room.qualities);
        }
        else if (room.qualities.includes(quality.toString())) {
        }
        else {
            if (room.qualities.length == 1) {
                quality = room.qualities[0];
                util.printInfo(`Only 1 quality: ${quality}`);
            }
            else {
                console.log(`available qualities:\n${room.qualities}`);
                while (true) {
                    quality = yield util.readlineSync();
                    if (room.qualities.includes(quality)) {
                        break;
                    }
                    util.printErr("out of range");
                }
            }
        }
        try {
            room.play(quality);
        }
        catch (e) {
            util.printErr(e);
            process.exit(1);
        }
    }
});
if (require.main === module) {
    main(process.argv[2]);
}
else {
    module.exports = { main };
}
