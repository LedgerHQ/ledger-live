import { retryAxiosRequest, getSpeculosAddress, getDeviceLabelCoordinates } from "../speculos";
import axios from "axios";
import { getEnv } from "@ledgerhq/live-env";
import { DeviceLabels } from "../enum/DeviceLabels";

function getSpeculosInfo(): {
  speculosApiPort: number;
  speculosAddress: string;
} {
  const speculosApiPort = getEnv("SPECULOS_API_PORT");
  const speculosAddress = getSpeculosAddress();
  return { speculosApiPort, speculosAddress };
}
export async function pressAndRelease(deviceLabel: DeviceLabels, x?: number, y?: number) {
  const { speculosApiPort, speculosAddress } = getSpeculosInfo();
  const { x: coordX, y: coordY } = await getDeviceLabelCoordinates(deviceLabel, speculosApiPort);
  x = x === undefined ? coordX : x;
  y = y === undefined ? coordY : y;
  await retryAxiosRequest(() =>
    axios.post(`${speculosAddress}:${speculosApiPort}/finger`, {
      action: "press-and-release",
      x: x,
      y: y,
    }),
  );
}

export async function longPressAndRelease(deviceLabel: DeviceLabels, delay: number) {
  const { speculosApiPort, speculosAddress } = getSpeculosInfo();
  const deviceLabelCoordinates = await getDeviceLabelCoordinates(deviceLabel, speculosApiPort);
  await retryAxiosRequest(() =>
    axios.post(`${speculosAddress}:${speculosApiPort}/finger`, {
      action: "press-and-release",
      x: deviceLabelCoordinates.x,
      y: deviceLabelCoordinates.y,
      delay: delay,
    }),
  );
}

export async function swipeRight() {
  const { speculosApiPort, speculosAddress } = getSpeculosInfo();
  await retryAxiosRequest(() =>
    axios.post(`${speculosAddress}:${speculosApiPort}/finger`, {
      action: "press-and-release",
      x: 100,
      y: 100,
      x2: 50,
      y2: 100,
      delay: 0.5,
    }),
  );
}
