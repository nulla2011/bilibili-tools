const chalk = require('chalk');
const util = require('./util.js');
const { Room } = require('./core/live.js');
const live = require('./core/live.js');

const main = async (arg, isHLS, quality) => {
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
        console.error(chalk.white.bold.bgRed(e));
        process.exit(1);
    }
    let room = new Room(roomID);
    await room.getInfo();
    console.log(chalk.bold.white(`标题：${room.title}\n人气：${room.online}\n开播时间：${room.live_time}`));
    console.log(chalk.bold.white(`分区：${room.parent_area_name} - ${room.area_name}`));
    if (!(isHLS == undefined || isHLS == null)) {
        room.isHLS = isHLS;
    }
    if (room.live_status != 1) {
        console.log(chalk.white.bold.bgRed("not streaming!"));
        process.exit();
    } else {
        await room.getQualities();
        if (quality == undefined || quality == null) {
            quality = Math.max(...room.qualities)
        } else if (room.qualities.includes(quality.toString())) {

        } else {
            if (room.qualities.length == 1) {
                quality = room.qualities[0];
                console.log(chalk.bold.white(`Only 1 quality: ${quality}`));
            } else {
                console.log(`available qualities:\n${room.qualities}`);
                while (true) {
                    quality = await util.readlineSync();
                    if (room.qualities.includes(quality)) { break; }
                    console.error(chalk.white.bold.bgRed("out of range"));
                }
            }
        }
        try {
            room.play(quality);
        } catch (e) {
            console.error(chalk.white.bold.bgRed(e));
            process.exit(1);
        }
    }
}

if (require.main === module) {
    main(process.argv[2]);
} else {
    module.exports = { main }
}