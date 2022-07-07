import toPairs from "lodash/toPairs";
import flatMap from "lodash/flatMap";
import groupBy from "lodash/groupBy";
import { from } from "rxjs";
import { concatMap, reduce } from "rxjs/operators";
import { flattenAccounts } from "@ledgerhq/live-common/account/index";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import type { Account } from "@ledgerhq/types-live";
export default {
  description: "Detect operation collisions",
  args: [...scanCommonOpts],
  job: (opts: ScanCommonOpts) =>
    scan(opts).pipe(
      reduce((all: Account[], a) => all.concat(a), []),
      concatMap((accounts) => {
        const allOps = flatMap(flattenAccounts(accounts), (a) => a.operations);
        const operationIdCollisions = toPairs(groupBy(allOps, "id"))
          .filter(([_, coll]) => coll.length > 1)
          .map(([_, coll]) => coll);
        return from(operationIdCollisions);
      })
    ),
};
