import { from } from "rxjs";
import { concatMap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { toOperationRaw } from "@ledgerhq/live-common/account/index";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";
import type { InferSignedOperationsOpts } from "../../signedOperation";
import { inferSignedOperations, inferSignedOperationsOpts } from "../../signedOperation";
export type BroadcastJobOpts = InferSignedOperationsOpts & ScanCommonOpts;
export default {
  description: "Broadcast signed operation(s)",
  args: [...scanCommonOpts, ...inferSignedOperationsOpts],
  job: (opts: BroadcastJobOpts) =>
    scan(opts).pipe(
      concatMap(account =>
        inferSignedOperations(account, opts).pipe(
          concatMap(signedOperation =>
            from(
              Promise.resolve()
                .then(() => getAccountBridge(account))
                .then(bridge =>
                  bridge.broadcast({
                    account,
                    signedOperation,
                  }),
                ),
            ),
          ),
        ),
      ),
      concatMap(async obj => JSON.stringify(await toOperationRaw(obj))),
    ),
};
