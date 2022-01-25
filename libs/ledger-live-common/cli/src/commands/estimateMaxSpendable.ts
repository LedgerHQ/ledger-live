import { concat, from } from "rxjs";
import { concatMap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import {
  getAccountUnit,
  getAccountName,
} from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";

const format = (account, value) => {
  const unit = getAccountUnit(account);
  const name = getAccountName(account);
  const amount = formatCurrencyUnit(unit, value, {
    showCode: true,
    disableRounding: true,
  });
  return `${name}: ${amount}`;
};

export default {
  description: "estimate the max spendable of an account",
  args: [...scanCommonOpts],
  job: (opts: ScanCommonOpts) =>
    scan(opts).pipe(
      concatMap((account) => {
        const bridge = getAccountBridge(account);
        return concat(
          from(
            bridge
              .estimateMaxSpendable({
                account,
                parentAccount: null,
              })
              .then((maxSpendable) => format(account, maxSpendable))
          ),
          ...(account.subAccounts || []).map((subAccount) =>
            from(
              bridge
                .estimateMaxSpendable({
                  account: subAccount,
                  parentAccount: account,
                })
                .then((maxSpendable) => "  " + format(subAccount, maxSpendable))
            )
          )
        );
      })
    ),
};
