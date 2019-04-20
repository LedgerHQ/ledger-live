// @flow

import { toAccountRaw } from "@ledgerhq/live-common/lib/account";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";

export default {
  default: account => account,

  json: account => JSON.stringify(toAccountRaw(account)),

  summary: account =>
    "(" +
    (account.derivationMode || "bip44") +
    "#" +
    account.index +
    ") " +
    formatCurrencyUnit(account.unit, account.balance, { showCode: true }) +
    " (" +
    account.operations.length +
    " operations) (" +
    account.freshAddress +
    " on " +
    account.freshAddressPath +
    ")" +
    (account.tokenAccounts || [])
      .map(
        ta =>
          "\n\t" +
          formatCurrencyUnit(ta.token.units[0], ta.balance, {
            showCode: true,
            disableRounding: true
          }) +
          " (" +
          ta.operations.length +
          " ops)"
      )
      .join("")
};
