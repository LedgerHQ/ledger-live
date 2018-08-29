// @flow

// accounts business logic functions to work with libcore

import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/helpers/currencies";
import { decodeAccountId } from "@ledgerhq/live-common/lib/helpers/account";
import type { AccountData } from "@ledgerhq/live-common/lib/bridgestream/types";

export const importExistingAccount = ({
  id,
  currencyId,
  name,
  freshAddress,
  freshAddressPath,
  index,
  balance,
}: AccountData): Account => {
  const { xpub } = decodeAccountId(id);
  const currency = getCryptoCurrencyById(currencyId);
  const account: $Exact<Account> = {
    id,
    xpub,
    name,
    currency,
    index,
    // these fields will be completed as we will sync
    freshAddress,
    freshAddressPath,
    blockHeight: 0,
    balance: BigNumber(balance),
    operations: [],
    pendingOperations: [],
    unit: currency.units[0],
    lastSyncDate: new Date(),
  };
  return account;
};
