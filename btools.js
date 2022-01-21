const Erii = require('erii').default;
const download = require('./dist/download.js').main;
const play = require('./dist/play.js').main;
const livePlay = require('./dist/livePlay.js').main;
const abv = require('./dist/abv.js');

Erii.setMetaInfo({
    version: "0.2.0",
    name: "bilibili tools"
});

Erii.bind({
    name: ["download", "d"],
    description: "download video",
    argument: {
        name: "input",
        description: "input"
    }
}, (ctx, options) => {
    let dash = options.dash;
    if (options.video || options.audio) {
        dash = true;
    }
    download(ctx.getArgument().toString(), options.output, options.title, dash, options.video ? 1 : 0, options.audio ? 1 : 0);
});
Erii.addOption({
    name: ["output", "o"],
    command: "download",
    argument: {
        name: "output",
        description: "input download path"
    }
});
Erii.addOption({
    name: ["title", "t"],
    command: "download",
    argument: {
        name: "title",
        description: "input file name"
    }
});
Erii.bind({
    name: ["play", "p"],
    description: "play video",
    argument: {
        name: "input",
        description: "input"
    }
}, (ctx, options) => {
    let dash = options.dash;
    let video = options.video ? 1 : 0;
    let audio = options.audio ? 1 : 0;
    if ((options.dash || options.hevc) && !(options.video || options.audio)) {
        [video, audio] = [1, 1];
    }
    if (options.video || options.audio) {
        dash = true;
    }
    if (options.hevc) {
        dash = true;
    }
    play(ctx.getArgument().toString(), dash, video, audio, options.hevc);
});
Erii.addOption({
    name: ["dash", "4"]
});
Erii.addOption({
    name: ["video", "v"]
});
Erii.addOption({
    name: ["audio", "a"]
});
Erii.addOption({
    name: ["hevc"]
});
Erii.bind({
    name: ["liveplay", "l"],
    description: "play live",
    argument: {
        name: "input",
        description: "input"
    }
}, (ctx, options) => {
    livePlay(ctx.getArgument().toString(), !options.nohls, options.quality);
});
Erii.addOption({
    name: ["nohls", "nh"],
    command: "liveplay"
});
Erii.addOption({
    name: ["quality", "q"],
    command: "liveplay",
    argument: {
        name: "quality",
        description: "quality number"
    }
});
Erii.bind({
    name: ["av2bv", "a2b"],
    description: "trans av to bv",
    argument: {
        name: "input",
        description: "input"
    }
}, (ctx) => {
    n = ctx.getArgument().toString();
    if (n.toLowerCase().startsWith("av")) {
        n = n.slice(2);
    }
    console.log(abv.encode(n));
});
Erii.bind({
    name: ["bv2av", "b2a"],
    description: "trans bv to av",
    argument: {
        name: "input",
        description: "input"
    }
}, (ctx) => {
    console.log(abv.decode(ctx.getArgument().toString()));
});

Erii.default(() => {
    Erii.showHelp();
});

Erii.okite();