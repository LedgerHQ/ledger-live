import { from } from "rxjs";
import { map, concatMap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { toOperationRaw } from "@ledgerhq/live-common/lib/account";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import type { InferSignedOperationsOpts } from "../signedOperation";
import {
  inferSignedOperations,
  inferSignedOperationsOpts,
} from "../signedOperation";
export default {
  description: "Broadcast signed operation(s)",
  args: [...scanCommonOpts, ...inferSignedOperationsOpts],
  job: (opts: ScanCommonOpts & InferSignedOperationsOpts) =>
    scan(opts).pipe(
      concatMap((account) =>
        inferSignedOperations(account, opts).pipe(
          concatMap((signedOperation) =>
            from(
              getAccountBridge(account).broadcast({
                account,
                signedOperation,
              })
            )
          )
        )
      ),
      map((obj) => JSON.stringify(toOperationRaw(obj)))
    ),
};
