import { of, concat, EMPTY, defer } from "rxjs";
import { ignoreElements, concatMap, mergeMap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";
import { asQR } from "../../qr";
export type ReceiveJobOpts = ScanCommonOpts & {
  qr: boolean;
};

export default {
  description: "Receive crypto-assets (verify on device)",
  args: [
    ...scanCommonOpts,
    {
      name: "qr",
      type: Boolean,
      desc: "also display a QR Code",
    },
  ],
  job: (opts: ReceiveJobOpts) =>
    scan(opts).pipe(
      concatMap(account =>
        concat(
          of(account.freshAddress),
          opts.qr ? asQR(account.freshAddress) : EMPTY,
          defer(() => Promise.resolve(getAccountBridge(account))).pipe(
            mergeMap(bridge =>
              bridge
                .receive(account, {
                  deviceId: opts.device || "",
                  verify: true,
                })
                .pipe(ignoreElements()),
            ),
          ),
        ),
      ),
    ),
};
