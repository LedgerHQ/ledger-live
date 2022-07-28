// @flow

import type { Observable } from "rxjs";
import { from } from "rxjs";
import type { DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import manager from "@ledgerhq/live-common/manager/index";

type Result = ?FirmwareUpdateContext;

const cmd = (deviceInfo: DeviceInfo): Observable<Result> =>
  from(manager.getLatestFirmwareForDevice(deviceInfo));

export default cmd;
