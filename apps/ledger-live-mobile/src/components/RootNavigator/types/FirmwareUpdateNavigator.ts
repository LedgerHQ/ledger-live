import { FirmwareUpdateContext } from "@ledgerhq/types-live";
import { ScreenName } from "../../../const";

export type FirmwareUpdateNavigatorParamList = {
  [ScreenName.FirmwareUpdateReleaseNotes]: {
    deviceId: string;
    firmware: FirmwareUpdateContext;
  };
  [ScreenName.FirmwareUpdateCheckId]: {
    deviceId: string;
    firmware: FirmwareUpdateContext;
  };
  [ScreenName.FirmwareUpdateMCU]: {
    deviceId: string;
    firmware: FirmwareUpdateContext;
  };
  [ScreenName.FirmwareUpdateConfirmation]: {
    deviceId: string;
    firmware: FirmwareUpdateContext;
  };
  [ScreenName.FirmwareUpdateFailure]: {
    deviceId: string;
    error: Error;
    firmware: FirmwareUpdateContext;
  };
};
