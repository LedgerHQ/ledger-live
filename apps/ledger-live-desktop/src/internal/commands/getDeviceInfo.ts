import type { Observable } from "rxjs";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from } from "rxjs";
import { DeviceInfo } from "@ledgerhq/types-live";
import getDeviceInfo from "@ledgerhq/live-common/hw/getDeviceInfo";

type Input = {
  deviceId: string,
};

const cmd = ({
  deviceId,
}: Input): Observable<DeviceInfo> => withDevice(deviceId)(transport => from(getDeviceInfo(transport)));

export default cmd;
