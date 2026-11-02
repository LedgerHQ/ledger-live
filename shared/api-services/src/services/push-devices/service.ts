import type { ApiServiceDescriptor, CommonConfig } from "../../compose";
import { pushDevicesApi, pushDevicesApiExtra, type PushDevicesApi } from "./api";
import type { PushDevicesApiExtra } from "./types";

export function pushDevicesService(
  own: () => Omit<PushDevicesApiExtra, keyof CommonConfig>,
): ApiServiceDescriptor<PushDevicesApi> {
  return {
    api: pushDevicesApi,
    buildExtra: common => pushDevicesApiExtra({ ...own(), ...common }),
  };
}
