import { Device } from "@ledgerhq/live-common/hw/actions/types";
export type SetCurrentDevice = (
  a: Device | null,
) => {
  type: string;
  payload: Device | null;
};
export const setCurrentDevice: SetCurrentDevice = payload => ({
  type: "SET_CURRENT_DEVICE",
  payload,
});
type AddDevice = (
  a: Device,
) => {
  type: string;
  payload: Device;
};
export const addDevice: AddDevice = payload => ({
  type: "ADD_DEVICE",
  payload,
});
type RemoveDevice = (
  a: Device,
) => {
  type: string;
  payload: Device;
};
export const removeDevice: RemoveDevice = payload => ({
  type: "REMOVE_DEVICE",
  payload,
});
export const resetDevices = () => ({
  type: "RESET_DEVICES",
});
