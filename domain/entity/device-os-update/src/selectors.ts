import type { DeviceOsUpdateState, OsUpdate } from "./schema";

type DeviceOsUpdateStateRoot = {
  deviceOsUpdate: DeviceOsUpdateState;
};

export function selectOsUpdates(state: DeviceOsUpdateStateRoot): OsUpdate[] {
  return state.deviceOsUpdate.osUpdates;
}

export function selectHasOsUpdates(state: DeviceOsUpdateStateRoot): boolean {
  return selectOsUpdates(state).length > 0;
}

export function selectHasBackup(state: DeviceOsUpdateStateRoot): boolean {
  return state.deviceOsUpdate.hasBackup;
}
