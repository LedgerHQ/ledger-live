import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { from, lastValueFrom } from "rxjs";
import Transport from "@ledgerhq/hw-transport";

export function runWithDevice<T>(
  deviceId: string,
  fn: (transport: Transport) => Promise<T>,
): Promise<T> {
  return lastValueFrom(withDevice(deviceId)(transport => from(fn(transport))));
}
