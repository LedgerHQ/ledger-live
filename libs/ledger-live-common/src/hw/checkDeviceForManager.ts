import Transport from "@ledgerhq/hw-transport";
import { Observable, of, throwError } from "rxjs";
import { UnexpectedBootloader } from "@ledgerhq/errors";
import genuineCheck from "./genuineCheck";
import { DeviceInfo, SocketEvent } from "@ledgerhq/types-live";
export default (
  transport: Transport,
  deviceInfo: DeviceInfo
): Observable<SocketEvent> =>
  deviceInfo.isOSU || deviceInfo.managerAllowed
    ? of({
        type: "result",
        payload: "0000",
      })
    : deviceInfo.isBootloader
    ? throwError(new UnexpectedBootloader())
    : genuineCheck(transport, deviceInfo);
