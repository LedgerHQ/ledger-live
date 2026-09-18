import { LkrpNotImplementedError } from "@shared/lkrp";
import type { LkrpDeviceLayer } from "@shared/lkrp";

export type CreateHwDeviceLayerOptions = {
  readonly deviceId: string;
};

export function createHwDeviceLayer(_options: CreateHwDeviceLayerOptions): LkrpDeviceLayer {
  return {
    execute: () => Promise.reject(new LkrpNotImplementedError("createHwDeviceLayer")),
  };
}
