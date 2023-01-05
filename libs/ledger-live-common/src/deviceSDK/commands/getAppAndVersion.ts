import Transport from "@ledgerhq/hw-transport";
import { from, Observable, of } from "rxjs";
import { switchMap } from "rxjs/operators";
import { GetAppAndVersionUnsupportedFormat } from "../../errors";

export type GetAppAndVersionCmdEvent = {
  type: "data";
  appAndVersion: {
    name: string;
    version: string;
    flags: number | Buffer;
  };
};

export function getAppAndVersion(
  transport: Transport
): Observable<GetAppAndVersionCmdEvent> {
  return new Observable((subscriber) => {
    // The device will always respond from this command: either same response than an unlocked device,
    // or 0x5515 if implemented. No unresponsive strategy needed.
    return from(transport.send(0xb0, 0x01, 0x00, 0x00))
      .pipe(
        switchMap((result) => {
          let i = 0;
          const format = result[i++];

          if (format !== 1) {
            throw new GetAppAndVersionUnsupportedFormat(
              "getAppAndVersion: format not supported"
            );
          }

          const nameLength = result[i++];
          const name = result.slice(i, (i += nameLength)).toString("ascii");
          const versionLength = result[i++];
          const version = result
            .slice(i, (i += versionLength))
            .toString("ascii");
          const flagLength = result[i++];
          const flags = result.slice(i, (i += flagLength));

          return of({
            type: "data" as const,
            appAndVersion: {
              name,
              version,
              flags,
            },
          });
        })
      )
      .subscribe(subscriber);
  });
}
