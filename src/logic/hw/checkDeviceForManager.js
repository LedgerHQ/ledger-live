// @flow
import Transport from "@ledgerhq/hw-transport";
import genuineCheck from "@ledgerhq/live-common/lib/hw/genuineCheck";
import type { DeviceInfo } from "@ledgerhq/live-common/lib/types/manager";
import { UnexpectedBootloader } from "@ledgerhq/live-common/lib/errors";
import { Observable, of, throwError } from "rxjs";

export default (
  transport: Transport<*>,
  deviceInfo: DeviceInfo,
): Observable<string> =>
  deviceInfo.isOSU
    ? of("0000")
    : deviceInfo.isBootloader
      ? throwError(new UnexpectedBootloader())
      : genuineCheck(transport, deviceInfo);
