// @flow

import { from, of, concat, empty } from "rxjs";
import { ignoreElements, concatMap } from "rxjs/operators";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import { asQR } from "../qr";

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
  job: (opts: ScanCommonOpts & { qr: boolean }) =>
    scan(opts).pipe(
      concatMap((account) =>
        concat(
          of(account.freshAddress),
          opts.qr ? asQR(account.freshAddress) : empty(),
          getAccountBridge(account)
            .receive(account, {
              deviceId: opts.device || "",
              verify: true,
            })
            .pipe(ignoreElements())
        )
      )
    ),
};
