import { Observable, from } from "rxjs";
import Transport from "@ledgerhq/hw-transport";
import { getAppAndVersion } from "./getAppAndVersion";
import { switchMap } from "rxjs/operators";
import { isDashboardName } from "../../hw/isDashboardName";

/**
 * Force the device to quit the currently opened app.
 *
 * If the device is already on the dashboard it does nothing and returns 9000.
 *
 * On firmware without 0x5515 (no locked device response):
 * If the device is locked, it will return 0x9000.
 * If the device is locked, and an app is opened, it will also return 9000 and the app will be closed when unlocked.
 *
 * On firmware with 0x5515 (locked device response):
 * If the device is locked, it will return 0x5515.
 * If the device is locked, and an app is opened, it will return 0x5515 and the app will **not** be closed when unlocked.
 *
 * @param transport a Transport instance
 */
export function quitApp(transport: Transport): Observable<void> {
  return from(getAppAndVersion(transport)).pipe(
    switchMap(async result => {
      if (isDashboardName(result.appAndVersion.name)) {
        return;
      }
      await transport.send(0xb0, 0xa7, 0x00, 0x00);
    }),
  );
}
