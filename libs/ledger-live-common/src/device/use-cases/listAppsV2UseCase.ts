import { Observable } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { DeviceInfo } from "@ledgerhq/types-live";
import { listAppsV2 } from "../../apps/listApps/v2";
import { ListAppsEvent } from "../../apps";

export function listAppsV2UseCase(
  transport: Transport,
  deviceInfo: DeviceInfo,
): Observable<ListAppsEvent> {
  return listAppsV2(transport, deviceInfo);
}
