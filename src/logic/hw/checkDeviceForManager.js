// @flow
import Transport from "@ledgerhq/hw-transport";
import { Observable, of, throwError } from "rxjs";
import { UnexpectedBootloader } from "../../errors";
import type { DeviceInfo } from "../../types/manager";
import genuineCheck from "./genuineCheck";

export default (
  transport: Transport<*>,
  deviceInfo: DeviceInfo,
): Observable<string> =>
  deviceInfo.isOSU
    ? of("9000")
    : deviceInfo.isBootloader
      ? throwError(new UnexpectedBootloader())
      : genuineCheck(transport, deviceInfo);
