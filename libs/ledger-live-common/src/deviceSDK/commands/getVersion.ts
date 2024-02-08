import { from, Observable, of } from "rxjs";
import { switchMap, finalize } from "rxjs/operators";
import Transport from "@ledgerhq/hw-transport";
import type { FirmwareInfo } from "@ledgerhq/types-live";
import { UnresponsiveCmdEvent } from "./core";
import { GET_VERSION_APDU } from "../../device-core/commands/use-cases/getVersion";
import { parseGetVersionResponse } from "../../device-core/commands/use-cases/parseGetVersionResponse";

export type GetVersionCmdEvent =
  | { type: "data"; firmwareInfo: FirmwareInfo }
  | UnresponsiveCmdEvent;

export type GetVersionCmdArgs = { transport: Transport };

export function getVersion({ transport }: GetVersionCmdArgs): Observable<GetVersionCmdEvent> {
  return new Observable(subscriber => {
    // TODO: defines actual value
    const oldTimeout = transport.unresponsiveTimeout;
    transport.setExchangeUnresponsiveTimeout(1000);
    const unresponsiveCallback = () => {
      // Needs to push a value and not an error to allow the command to continue once
      // the device is not unresponsive anymore. Pushing an error would stop the command.
      subscriber.next({ type: "unresponsive" });
    };
    transport.on("unresponsive", unresponsiveCallback);

    return from(transport.send(...GET_VERSION_APDU))
      .pipe(
        switchMap((value: Buffer) => {
          transport.off("unresponsive", unresponsiveCallback);

          const firmwareInfo = parseGetVersionResponse(value);

          return of({
            type: "data" as const,
            firmwareInfo,
          });
        }),
        finalize(() => {
          // Cleans the unresponsive timeout on complete and error
          // Note: careful if this command is called sequentially several time (in a `concat`)
          // as the beginning of the next command could happen before this cleaning `finalize` is called.
          transport.setExchangeUnresponsiveTimeout(oldTimeout);
        }),
      )
      .subscribe(subscriber);
  });
}
