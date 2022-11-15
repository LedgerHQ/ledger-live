import { from, Observable } from "rxjs";
import { withDevicePolling } from "@ledgerhq/live-common/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";
import { DeviceInfo } from "@ledgerhq/types-live";

type Input = {
  deviceId: string;
};

type Result = DeviceInfo;

// Waits until getting device info
const cmd = ({ deviceId }: Input): Observable<Result> =>
  withDevicePolling(deviceId)(
    transport => from(getDeviceInfo(transport)),
    () => true, // Accepts all errors, making the command waits forever until getDeviceInfo works
  );

cmd.inferSentryTransaction = () => ({});

export default cmd;
