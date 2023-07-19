const Erii = require('erii').default;
const download = require('./download.js').main;
const play = require('./play.js').main;
const livePlay = require('./livePlay.js').main;
const liveDanmaku = require('./live-danmaku.js').main;
const abv = require('./abv.js');

Erii.setMetaInfo({
    version: "0.3.0",
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
    let video = options.video ? 1 : 0;
    let audio = options.audio ? 1 : 0;
    if ((options.dash || options.hevc) && !(options.video || options.audio)) {
        [video, audio] = [1, 1];
    }
    if (options.video || options.audio) {
        dash = true;
    }
    download(ctx.getArgument().toString(), options.output, options.title, dash, video, audio);
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
    livePlay(ctx.getArgument().toString(), {
        format: options.flv ? "flv" : options.ts ? "ts" : "",
        quality: options.quality,
        isHevc: !!options["265"]
    });
});
Erii.addOption({
    name: ["flv"],
    command: "liveplay"
});
Erii.addOption({
    name: ["ts"],
    command: "liveplay"
});
Erii.addOption({
    name: ["265"],
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
Erii.bind({
    name: ["livedm", "ldm"],
    description: "show live danmaku",
    argument: {
        name: "input",
        description: "input"
    }
}, (ctx, options) => {
    liveDanmaku(ctx.getArgument().toString(), { showR: options.showR });
});
Erii.addOption({
    name: ["showrq", "rq"],
    command: "livedm",
});

Erii.default(() => {
    Erii.showHelp();
});

Erii.okite();