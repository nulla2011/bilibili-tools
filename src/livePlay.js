const util = require('./utils');
const { Room } = require('./core/live.js');
const live = require('./core/live.js');

const main = async (arg, { format, quality, isHevc }) => {
    let line;
    if (arg == undefined) {
        console.log("input link or room id:");
        line = await util.readlineSync();
    } else {
        line = arg;
    }
    let roomID;
    try {
        roomID = await live.getRoomID(line);
    } catch (e) {
        util.printErr(e);
        process.exit(1);
    }
    let room = new Room(roomID);
    try {
        await room.getInfo();
    } catch (e) {
        util.printErr(e);
        process.exit(1);
    }
    util.printInfo(`标题：${room.title}\n人气：${room.online}\n开播时间：${room.live_time}\n分区：${room.parent_area_name} - ${room.area_name}`);
    if (format) room.format = format;
    room.isHevc = !!isHevc;
    if (room.live_status != 1) {
        util.printErr("not streaming!");
        process.exit();
    } else {
        // await room.getQualities();
        if (quality == undefined || quality == null) {
            quality = 30000
        }
        // else {
        //     if (room.qualities.length == 1) {
        //         quality = room.qualities[0];
        //         util.printInfo(`Only 1 quality: ${quality}`);
        //     } else {
        //         console.log(`available qualities:\n${room.qualities}`);
        //         while (true) {
        //             quality = await util.readlineSync();
        //             if (room.qualities.includes(quality)) { break; }
        //             util.printErr("out of range");
        //         }
        //     }
        // }
        try {
            room.play(quality);
        } catch (e) {
            util.printErr(e);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    main(process.argv[2], {
        format: process.argv[3],
        quality: process.argv[4],
        isHevc: process.argv[5] == '265' || process.argv[5] == 'hevc'
    });
} else {
    module.exports = { main }
}