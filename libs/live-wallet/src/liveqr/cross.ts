// cross helps dealing with cross-project feature like export/import & cross project conversions
import { BigNumber } from "bignumber.js";
import {
  runDerivationScheme,
  getDerivationScheme,
  asDerivationMode,
} from "@ledgerhq/coin-framework/derivation";
import { decodeAccountId, emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { Account, AccountUserData } from "@ledgerhq/types-live";

export type AccountData = {
  id: string;
  currencyId: string;
  freshAddress?: string;
  seedIdentifier: string;
  derivationMode: string;
  // we are unsafe at this stage, validation is done later
  name: string;
  index: number;
  balance: string;
};

export type Result = {
  accounts: AccountData[];
};

export function accountToAccountData(
  { id, seedIdentifier, derivationMode, freshAddress, currency, index, balance }: Account,
  { name }: AccountUserData,
): AccountData {
  const res: AccountData = {
    id,
    name,
    seedIdentifier,
    derivationMode,
    freshAddress,
    currencyId: currency.id,
    index,
    balance: balance.toString(),
  };

  return res;
}
// reverse the account data to an account.
// this restore the essential data of an account and the result of the fields
// are assumed to be restored during first sync
export const accountDataToAccount = ({
  id,
  currencyId,
  freshAddress: inputFreshAddress,
  name,
  index,
  balance,
  derivationMode: derivationModeStr,
  seedIdentifier,
}: AccountData): [Account, AccountUserData] => {
  const { xpubOrAddress } = decodeAccountId(id); // TODO rename in AccountId xpubOrAddress

  const derivationMode = asDerivationMode(derivationModeStr);
  const currency = getCryptoCurrencyById(currencyId);
  let xpub = "";
  let freshAddress = inputFreshAddress || "";
  let freshAddressPath = "";

  if (
    // FIXME Dirty hack, since we have no way here to know if "xpubOrAddress" is one or the other.
    // Proposed fix: https://ledgerhq.atlassian.net/browse/LL-7437
    currency.family === "bitcoin" ||
    currency.family === "cardano"
  ) {
    // In bitcoin implementation, xpubOrAddress field always go in the xpub
    xpub = xpubOrAddress;
  } else {
    if (currency.family === "tezos" || currency.family === "stacks") {
      xpub = xpubOrAddress;
    } else if (!freshAddress) {
      // otherwise, it's the freshAddress
      freshAddress = xpubOrAddress;
    }

    freshAddressPath = runDerivationScheme(
      getDerivationScheme({
        currency,
        derivationMode,
      }),
      currency,
      {
        account: index,
      },
    );
  }

  const balanceBN = new BigNumber(balance);
  const account: Account = {
    type: "Account",
    id,
    derivationMode,
    seedIdentifier,
    xpub,
    used: false,
    currency,
    index,
    freshAddress,
    freshAddressPath,
    swapHistory: [],
    blockHeight: 0,
    balance: balanceBN,
    spendableBalance: balanceBN,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(0),
    creationDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
  };

  const accountUserData: AccountUserData = {
    id,
    name,
    starredIds: [],
  };

  return [account, accountUserData];
};
