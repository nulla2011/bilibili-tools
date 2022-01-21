"use strict";
const charTable = 'fZodR9XQDSUm21yCkr6zBqiveYah8bt4xsWpHnJE7jL5VG3guMTKNPAwcF';
const xorNum = 177451812;
const addNum = 8728348608;
const indexList = [11, 10, 3, 8, 4, 6];
// let charReverseMap = new Map();
// for (let i = 0; i < charTable.length; i++) {
//     charReverseMap.set(charTable[i], i);
// }
let decode = (x) => {
    let n = 0;
    for (let i = 0; i < 6; i++) {
        n += charTable.indexOf(x[indexList[i]]) * 58 ** i;
    }
    return (n - addNum) ^ xorNum;
};
let encode = (x) => {
    x = (x ^ xorNum) + addNum;
    let b = [..."BV1__4_1_7__"];
    for (let i = 0; i < 6; i++) {
        b[indexList[i]] = charTable[Math.floor(x / 58 ** i) % 58];
    }
    return b.join('');
};
if (require.main === module) {
}
else {
    module.exports = { decode, encode };
}
