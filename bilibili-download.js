const http = require('http');
const url = require('url');
const readline = require('readline');
const fs = require('fs');
const exec = require('child_process').exec;

const getInfoAPI = "https://api.bilibili.com/x/player/pagelist";
const getPlayurlAPI = "https://api.bilibili.com/x/player/playurl";
const statAPI = "https://api.bilibili.com/x/web-interface/archive/stat";
const viewAPI = "https://api.bilibili.com/x/web-interface/view";

const readlineAsync = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        //prompt: 'input link or BV:'
    });
    return new Promise((resolve) => {
        rl.prompt();
        rl.on('line', (line) => {
            rl.close();
            resolve(line);
        });
    });
};
const httpGet = (options) => {
    return new Promise((resolve, reject) => {
        var req = http.request(options, (res) => {
            let str = "";
            if (res.statusCode < 200 || res.statusCode >= 300) {
                return reject(new Error('statusCode=' + res.statusCode));
            }
            res.on('data', (chunk) => { str += chunk });
            res.on('end', () => {
                resolve(JSON.parse(str));
            });
            req.on('error', function (err) {
                reject(err);
            });
        });
        req.end();
    });
};
const consoleAsync = (cmdString) => {
    return new Promise((resolve, reject) => {
        exec(cmdString, (error, stdout, stderr) => {
            if (error) {
                console.error('error: ' + error);
                reject(error);
                return;
            }
            console.log('stdout: ' + stdout);
            resolve(stdout);
            console.log('stderr: ' + typeof stderr);
        });
    });
};
var input2Bv = async () => {
    console.log("input link or BV or aid:");
    let line = await readlineAsync();
    let bvid;
    let av = line.match(/[aA][vV](\d+)/);
    let avid = line.match(/^\d+$/);
    if (av) {
        bvid = await av2bv(av[1]);
    } else if (avid) {
        bvid = await av2bv(avid);
    } else {
        bvid = line.match(/[bB][vV]\w{10}/);
    }
    console.log(bvid);
    return bvid;
}
var getPartinfo = async (bv) => {
    let fullUrl = getInfoAPI + url.format({
        query: {
            bvid: bv,
            jsonp: "jsonp"
        }
    });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET'
    };
    let response = await httpGet(options);
    return response;
};
var getVideoInfo = async (input) => {
    let av = input.match(/[aA][vV](\d+)/);
    let aid = av ? av[1] : input.match(/^\d+$/);
    let bvid = input.match(/[bB][vV]\w{10}/);
    if (!bvid && !aid) {
        throw "input illegal";
    }
    let parameters = bvid ? { bvid: bvid } : aid ? { aid: aid } : null;
    let fullUrl = viewAPI + url.format({ query: parameters });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET'
    };
    let response = await httpGet(options);
    if (response.code !== 0) {
        throw "code:" + response.code + " message:" + response.message;
    }
    let info = new Object();
    info.bvid = response.data.bvid;
    info.aid = response.data.aid;
    info.videos = response.data.videos;
    info.title = response.data.title;
    info.pages = [];
    for (let item of response.data.pages) {
        let page = new Object();
        page.page = item.page;
        page.cid = item.cid;
        page.part = item.part;
        info.pages.push(page);
    }
    //console.log(info);
    return info;
};
var getPlayurl = async (av, cid, cookie) => {
    let fullUrl = getPlayurlAPI + url.format({
        query: {
            avid: av,
            cid: cid,
            qn: 116,        //quality
            fnver: 0,
            fnval: 0,
            player: 1,
            otype: "json"
        }
    });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET',
        headers: {
            'referer': 'https://www.bilibili.com/',
            'cookie': cookie
        }
    };
    let response = await httpGet(options);
    if (response.code !== 0) {
        throw "code:" + response.code + " message:" + response.message;
    }
    return response.data.durl[0].url;
};
var bv2av = async (bv) => {
    let fullUrl = viewAPI + url.format({
        query: {
            bvid: bv
        }
    });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET'
    };
    let response = await httpGet(options);
    return response.data.aid;
};
var av2bv = async (av) => {
    let fullUrl = viewAPI + url.format({
        query: {
            aid: av
        }
    });
    let options = {
        hostname: "api.bilibili.com",
        port: 80,
        path: fullUrl.replace("https://api.bilibili.com", ""),
        method: 'GET'
    };
    let response = await httpGet(options);
    return response.data.bvid;
};

const main = async () => {
    let cookie = fs.readFileSync("cookies.ck", 'utf8')
    console.log("input link or BV or aid:");
    let line = await readlineAsync();
    //let line="BV1s34y1Q76t";
    let videoInfo;
    try {
        videoInfo = await getVideoInfo(line);
    }
    catch (e) {
        console.error(e);
        process.exit();
    }
    //let bv = await input2Bv();
    //let info = await getPartinfo(bv);
    let dlList = [];
    if (videoInfo.videos === 1) {
        dlList = [{ cid: videoInfo.pages[0].cid, part: videoInfo.pages[0].part }];
        console.log("only 1 part, downloading..");
    } else {
        for (let item of videoInfo.pages) {
            console.log(item.page.toString().padStart(2, '0'), item.part);
        }
        console.log(videoInfo.videos + " parts, which do you want?");
        let inp = await readlineAsync();
        //let inp = '3 1';

        if (inp == '') {
            for (let i of videoInfo.pages) {
                dlList.push({ cid: i.cid, part: i.part })
            }
        } else {
            for (let i of inp.split(/[ ,]/)) {
                dlList.push({ cid: videoInfo.pages[i - 1].cid, part: videoInfo.pages[i - 1].part })
            }
        }
    }
    for (let item of dlList) {
        let dlUrl;
        try {
            dlUrl = await getPlayurl(videoInfo.aid, item.cid, cookie);
        } catch (e) {
            console.error(e);
            process.exit();
        }
        console.log(dlUrl);
        let cmdString = 'aria2c -s 16 -x 16 --referer="https://www.bilibili.com" "' + dlUrl + '"';
        await consoleAsync(cmdString);
    }
};

main();