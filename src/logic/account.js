// @flow

// accounts business logic functions to work with libcore

import { BigNumber } from "bignumber.js";
import type { Account, CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/lib/helpers/currencies";
import { decodeAccountId } from "@ledgerhq/live-common/lib/helpers/account";
import type { AccountData } from "@ledgerhq/live-common/lib/bridgestream/types";
import { listCryptoCurrencies } from "../cryptocurrencies";

export const supportsExistingAccount = ({
  currencyId,
}: {
  currencyId: string,
}) => listCryptoCurrencies(true).some(c => c.id === currencyId);

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
    lastSyncDate: new Date(0),
  };
  return account;
};

// TODO migrate to live-common

const MAX_ACCOUNT_NAME_SIZE = 50;

export const getAccountPlaceholderName = (
  c: CryptoCurrency,
  index: number,
  isLegacy: boolean = false,
  isUnsplit: boolean = false,
) =>
  `${c.name} ${index + 1}${isLegacy ? " (legacy)" : ""}${
    isUnsplit ? " (unsplit)" : ""
  }`;

export const getNewAccountPlaceholderName = getAccountPlaceholderName; // same naming
// export const getNewAccountPlaceholderName = (_c: CryptoCurrency, _index: number) => `New Account`

export const validateNameEdition = (account: Account, name: ?string): string =>
  (
    (name || account.name || "").replace(/\s+/g, " ").trim() ||
    account.name ||
    getAccountPlaceholderName(account.currency, account.index)
  ).slice(0, MAX_ACCOUNT_NAME_SIZE);
