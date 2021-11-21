const Erii = require('erii').default;
const download = require('./download.js').main;
const play = require('./play.js').main;
const livePlay = require('./livePlay.js').main;

Erii.setMetaInfo({
    version: "0.0.1",
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
Erii.bind({
    name: ["play", "p"],
    description: "play video",
    argument: {
        name: "input",
        description: "input"
    }
}, (ctx, options) => {
    let dash = options.dash;
    if (options.video || options.audio) {
        dash = true;
    }
    play(ctx.getArgument().toString(), dash, options.video ? 1 : 0, options.audio ? 1 : 0);
});
Erii.addOption({
    name: ["dash", "d"]
});
Erii.addOption({
    name: ["video", "v"]
});
Erii.addOption({
    name: ["audio", "a"]
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

Erii.default(() => {
    Erii.showHelp();
});

Erii.okite();