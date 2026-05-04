import { concat, defer, from } from "rxjs";
import { concatMap, mergeMap } from "rxjs/operators";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { formatCurrencyUnit } from "@ledgerhq/live-common/currencies/index";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

const format = (account: AccountLike, value: BigNumber) => {
  const unit = getAccountCurrency(account).units[0];
  const name = getDefaultAccountName(account);
  const amount = formatCurrencyUnit(unit, value, {
    showCode: true,
    disableRounding: true,
  });
  return `${name}: ${amount}`;
};

export type EstimateMaxSpendableJobOpts = ScanCommonOpts;

export default {
  description: "estimate the max spendable of an account",
  args: [...scanCommonOpts],
  job: (opts: EstimateMaxSpendableJobOpts) =>
    scan(opts).pipe(
      concatMap(account =>
        defer(() => Promise.resolve(getAccountBridge(account))).pipe(
          mergeMap(bridge =>
            concat(
              from(
                bridge
                  .estimateMaxSpendable({
                    account,
                    parentAccount: null,
                  })
                  .then(maxSpendable => format(account, maxSpendable)),
              ),
              ...(account.subAccounts || []).map(subAccount =>
                from(
                  bridge
                    .estimateMaxSpendable({
                      account: subAccount,
                      parentAccount: account,
                    })
                    .then(maxSpendable => "  " + format(subAccount, maxSpendable)),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
};
