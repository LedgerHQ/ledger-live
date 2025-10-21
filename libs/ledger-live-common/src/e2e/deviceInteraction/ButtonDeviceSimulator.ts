import { getEnv } from "@ledgerhq/live-env";
import { getSpeculosAddress, retryAxiosRequest } from "../speculos";
import axios from "axios";

export async function pressBoth() {
  const speculosApiPort = getEnv("SPECULOS_API_PORT");
  const speculosAddress = getSpeculosAddress();
  await retryAxiosRequest(() =>
    axios.post(`${speculosAddress}:${speculosApiPort}/button/both`, {
      action: "press-and-release",
    }),
  );
}

export async function pressRightButton(): Promise<void> {
  const speculosApiPort = getEnv("SPECULOS_API_PORT");
  const speculosAddress = getSpeculosAddress();
  await retryAxiosRequest(() =>
    axios.post(`${speculosAddress}:${speculosApiPort}/button/right`, {
      action: "press-and-release",
    }),
  );
}
