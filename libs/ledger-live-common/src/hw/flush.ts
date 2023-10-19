import { firstValueFrom, of } from "rxjs";
import { withDevice } from "./deviceAccess";
import { delay } from "../promise";

const flush = (deviceId: string): Promise<any> =>
  delay(1000).then(() => firstValueFrom(withDevice(deviceId)(() => of(null))));

export default flush;
