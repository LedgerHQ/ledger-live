// @flow

import { concat, from } from "rxjs";
import { concatMap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";

const format = (account, value) => {
  const amount = formatCurrencyUnit(account.unit, value, {
    showCode: true
  });
  return `${account.name} can spend ${amount}`;
};

export default {
  description: "estimate the max spendable of an account",
  args: [...scanCommonOpts],
  job: (opts: ScanCommonOpts) =>
    scan(opts).pipe(
      concatMap(account => {
        const bridge = getAccountBridge(account);
        return concat(
          from(
            bridge
              .estimateMaxSpendable({
                account,
                parentAccount: null
              })
              .then(maxSpendable => format(account, maxSpendable))
          ),
          ...(account.subAccounts || []).map(subAccount =>
            from(
              bridge
                .estimateMaxSpendable({
                  account: subAccount,
                  parentAccount: account
                })
                .then(maxSpendable => "  " + format(account, maxSpendable))
            )
          )
        );
      })
    )
};
