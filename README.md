# README

一个 CLI 的 bilibili 工具合集

## 依赖

```
npm install
```

* aria2
* mpv
* ffmpeg （可选）

## 用法

运行`node btools.js`查看用法

### 下载视频

`node btools.js -d [视频链接或bv/av号]`（需要 aria2 ）

**需要在配置文件里添加 session 字段（也就是 cookie）来获取最高画质，方法如下**

随便打开一个视频，然后 F12 切到 Application 选项卡，在左边 Storage 里找到 Cookies ，展开选主站，然后在右边的表里找到 SESSDATA 字段，复制 value，然后粘贴到 config.json 的 session 字段里。

![](https://gitcode.net/message2011/tttp/-/raw/master/session.png)

### 用 mpv 等播放器播放在线视频

`node btools.js -p [视频链接或bv/av号]`（需要 mpv ）

### 播放直播

`node btools.js -l [房间号]`（需要 mpv ）

### 其他工具

- dist/monitor-video-change.js:


监测稿件变化，建议配合 pm2 使用

```
pm2 start dist/monitor-video-change.js -- <av号或bv号或链接>
```

- dist/monitor-live.js:

开播提醒，同样建议挂 pm2 。

运行 `node dist/monitor-live.js -a [房间号]` 添加关注的房间。

- dist/stat-bangumi-every-day.ts:

定时抓取番剧的播放量弹幕量收藏量等数据，同样建议挂 pm2 。

## todo

推流