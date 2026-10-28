import type { ApiServiceDescriptor, CommonConfig } from "../../compose";
import { swapApi, swapApiExtra, type SwapApi } from "./api";
import type { SwapApiExtra } from "./types";

export function swapService(
  own: () => Omit<SwapApiExtra, keyof CommonConfig>,
): ApiServiceDescriptor<SwapApi> {
  return { api: swapApi, buildExtra: common => swapApiExtra({ ...own(), ...common }) };
}
