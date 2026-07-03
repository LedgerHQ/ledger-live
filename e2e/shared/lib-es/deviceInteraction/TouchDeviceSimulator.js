import { getSpeculosAddress, getDeviceLabelCoordinates } from "../speculos";
import axios from "axios";
import { getEnv } from "@ledgerhq/live-env";
import { retryAxiosRequest } from "./retryAxiosRequest";
function getSpeculosInfo() {
    const speculosApiPort = getEnv("SPECULOS_API_PORT");
    const speculosAddress = getSpeculosAddress();
    return { speculosApiPort, speculosAddress };
}
export async function pressAndRelease(deviceLabel, x, y) {
    const { speculosApiPort, speculosAddress } = getSpeculosInfo();
    let xCoord;
    let yCoord;
    if (x && y) {
        xCoord = x;
        yCoord = y;
    }
    else {
        const coords = await getDeviceLabelCoordinates(deviceLabel, speculosApiPort);
        xCoord = coords.x;
        yCoord = coords.y;
    }
    await retryAxiosRequest(() => axios.post(`${speculosAddress}:${speculosApiPort}/finger`, {
        action: "press-and-release",
        x: xCoord,
        y: yCoord,
    }));
}
export async function longPressAndRelease(deviceLabel, delay) {
    const { speculosApiPort, speculosAddress } = getSpeculosInfo();
    const deviceLabelCoordinates = await getDeviceLabelCoordinates(deviceLabel, speculosApiPort);
    await retryAxiosRequest(() => axios.post(`${speculosAddress}:${speculosApiPort}/finger`, {
        action: "press-and-release",
        x: deviceLabelCoordinates.x,
        y: deviceLabelCoordinates.y,
        delay: delay,
    }));
}
export async function swipeRight() {
    const { speculosApiPort, speculosAddress } = getSpeculosInfo();
    await retryAxiosRequest(() => axios.post(`${speculosAddress}:${speculosApiPort}/finger`, {
        action: "press-and-release",
        x: 100,
        y: 100,
        x2: 50,
        y2: 100,
        delay: 0.5,
    }));
}
//# sourceMappingURL=TouchDeviceSimulator.js.map