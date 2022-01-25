import { of, interval } from "rxjs";
import { reduce, mergeMap, shareReplay, tap } from "rxjs/operators";
import { dataToFrames } from "qrloop";
import { encode } from "@ledgerhq/live-common/lib/cross";
import { asQR } from "../qr";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import { Account } from "@ledgerhq/live-common/lib/types";
export default {
  description: "Export given accounts to Live QR or console for importing",
  args: [
    ...scanCommonOpts,
    {
      name: "out",
      alias: "o",
      type: Boolean,
      desc: "output to console",
    },
  ],
  job: (
    opts: ScanCommonOpts &
      Partial<{
        out: boolean;
      }>
  ) =>
    scan(opts).pipe(
      reduce<Account, Account[]>(
        (accounts, account) => accounts.concat(account),
        []
      ),
      mergeMap((accounts) => {
        const data = encode({
          accounts,
          settings: {
            pairExchanges: {},
            currenciesSettings: {},
          },
          exporterName: "ledger-live-cli",
          exporterVersion: "0.0.0",
        });
        const frames = dataToFrames(data, 80, 4);

        if (opts.out) {
          return of(Buffer.from(JSON.stringify(frames)).toString("base64"));
        } else {
          const qrObservables = frames.map((str) =>
            asQR(str).pipe(shareReplay())
          );
          return interval(300).pipe(
            mergeMap((i) => qrObservables[i % qrObservables.length])
          );
        }
      }),
      tap(() => console.clear()) // eslint-disable-line no-console
    ),
};
