import { Subject } from "rxjs";

import { UpdateFirmwareActionState } from "@ledgerhq/live-common/deviceSDK/actions/updateFirmware";
import { GetDeviceInfoActionState } from "@ledgerhq/live-common/deviceSDK/actions/getDeviceInfo";
import { mockUpdateFirmwareAction } from "@ledgerhq/live-common/deviceSDK/hooks/useUpdateFirmware";
import { mockGetDeviceInfoAction } from "@ledgerhq/live-common/deviceSDK/hooks/useGetDeviceInfo";

export type UpdateDeviceActionStateMessage = {
  deviceAction: "updateFirmware";
  newState: UpdateFirmwareActionState;
} | {
  deviceAction: "getDeviceInfo";
  newState: GetDeviceInfoActionState;
};
// | "getDeviceInfo" | "genuineCheck" | etc

const FirmwareUpdateStateSubject =
  new Subject<UpdateFirmwareActionState>();
const GetDeviceInfoStateSubject = 
new Subject<GetDeviceInfoActionState>();
// export const GenuineCheckStateSubject
// etc

export function mockDeviceActions(
  deviceActionToMock: UpdateDeviceActionStateMessage["deviceAction"],
) {
  switch (deviceActionToMock) {
    case "updateFirmware":
      mockUpdateFirmwareAction((_: unknown) => FirmwareUpdateStateSubject);
      break;
    case "getDeviceInfo":
      mockGetDeviceInfoAction((_: unknown) => GetDeviceInfoStateSubject);
      break;
    // case "genuineCheck":
    // etc
    default:
      break;
  }
}

export function updateDeviceActionState(
  message: UpdateDeviceActionStateMessage,
) {
  switch (message.deviceAction) {
    case "updateFirmware":
      FirmwareUpdateStateSubject.next(message.newState);
      break;
    case "getDeviceInfo":
      GetDeviceInfoStateSubject.next(message.newState);
      break;
    // case "getDeviceInfo":
    // case "genuineCheck":
    // etc
    default:
      break;
  }
}
