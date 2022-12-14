import Transport from "@ledgerhq/hw-transport";
import { DeviceId } from "@ledgerhq/types-live";
import { from } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";

// The job never returns a result. It always pushes its events/results or errors
// to a subscriber variable (often named o) coming from a wrapping Observable.
export type AsyncJob = (t: Transport) => Promise<void>;

// toPromise: subscribe to this Observable and get a Promise resolving on complete with the last emission (if any).
// On RxJS 7: update toPromise to firstValueFrom or lastValueFrom: https://rxjs.dev/deprecations/to-promise
export const withTransportAsyncJob = (
  deviceId: DeviceId,
  asyncJob: AsyncJob
): Promise<void> =>
  withDevice(deviceId)((transport) => from(asyncJob(transport))).toPromise();
