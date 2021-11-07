const chalk = require('chalk');
const util = require('./util.js');
const { Room } = require('./core/live.js');
const live = require('./core/live.js');

const arg = process.argv[2];

const main = async () => {
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
    console.log(chalk.bold.white(`分区：${room.parent_area_name}`));
    if (room.live_status != 1) {
        console.log(chalk.white.bold.bgRed("not streaming!"));
        process.exit();
    } else {
        await room.getQualities();
        console.log(`available qualities:\n${room.qualities}`);
        let inp;
        while (true) {
            inp = await util.readlineSync();
            if (room.qualities.includes(inp)) { break; }
            console.error(chalk.white.bold.bgRed("out of range"));
        }
        try {
            room.play(inp);
        } catch (e) {
            console.error(chalk.white.bold.bgRed(e));
            process.exit(1);
        }
    }
}

main();