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
    console.log(await room.getQualities());
    line = await util.readlineSync();
    try {
        room.play(line);
    } catch (e) {
        console.error(chalk.white.bold.bgRed(e));
        process.exit(1);
    }
}

main();