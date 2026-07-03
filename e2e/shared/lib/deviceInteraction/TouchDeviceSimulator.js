"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pressAndRelease = pressAndRelease;
exports.longPressAndRelease = longPressAndRelease;
exports.swipeRight = swipeRight;
const speculos_1 = require("../speculos");
const axios_1 = __importDefault(require("axios"));
const live_env_1 = require("@ledgerhq/live-env");
const retryAxiosRequest_1 = require("./retryAxiosRequest");
function getSpeculosInfo() {
    const speculosApiPort = (0, live_env_1.getEnv)("SPECULOS_API_PORT");
    const speculosAddress = (0, speculos_1.getSpeculosAddress)();
    return { speculosApiPort, speculosAddress };
}
async function pressAndRelease(deviceLabel, x, y) {
    const { speculosApiPort, speculosAddress } = getSpeculosInfo();
    let xCoord;
    let yCoord;
    if (x && y) {
        xCoord = x;
        yCoord = y;
    }
    else {
        const coords = await (0, speculos_1.getDeviceLabelCoordinates)(deviceLabel, speculosApiPort);
        xCoord = coords.x;
        yCoord = coords.y;
    }
    await (0, retryAxiosRequest_1.retryAxiosRequest)(() => axios_1.default.post(`${speculosAddress}:${speculosApiPort}/finger`, {
        action: "press-and-release",
        x: xCoord,
        y: yCoord,
    }));
}
async function longPressAndRelease(deviceLabel, delay) {
    const { speculosApiPort, speculosAddress } = getSpeculosInfo();
    const deviceLabelCoordinates = await (0, speculos_1.getDeviceLabelCoordinates)(deviceLabel, speculosApiPort);
    await (0, retryAxiosRequest_1.retryAxiosRequest)(() => axios_1.default.post(`${speculosAddress}:${speculosApiPort}/finger`, {
        action: "press-and-release",
        x: deviceLabelCoordinates.x,
        y: deviceLabelCoordinates.y,
        delay: delay,
    }));
}
async function swipeRight() {
    const { speculosApiPort, speculosAddress } = getSpeculosInfo();
    await (0, retryAxiosRequest_1.retryAxiosRequest)(() => axios_1.default.post(`${speculosAddress}:${speculosApiPort}/finger`, {
        action: "press-and-release",
        x: 100,
        y: 100,
        x2: 50,
        y2: 100,
        delay: 0.5,
    }));
}
//# sourceMappingURL=TouchDeviceSimulator.js.map