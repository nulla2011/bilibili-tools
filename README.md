# README

**添加cookie 获取更高画质**

## 依赖

```
npm install Erii
```

* aria2

* mpv

## 用法

下载视频运行download.js ，需要aria2

播放视频运行play.js ，需要mpv

dist/monitor-video-change.js:

监测稿件变化，建议配合pm2使用

```
pm2 start dist/monitor-video-change.js -- <av号或bv号或链接>
```

## todo

推流