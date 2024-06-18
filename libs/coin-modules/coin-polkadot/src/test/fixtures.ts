import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { PolkadotAccount } from "../types";
import { decodeAccountId } from "@ledgerhq/coin-framework/account";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import { SubAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";

export const makeAccount = (
  address: string,
  currency: CryptoCurrency,
  subAccounts: SubAccount[] = [],
): PolkadotAccount => {
  const id = `js:2:${currency.id}:${address}:polkadotbip44`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({
    derivationMode,
    currency,
  });

  const index = 0;
  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: index,
    node: 0,
    address: 0,
  });

  return {
    type: "Account",
    id,
    xpub: xpubOrAddress,
    subAccounts,
    seedIdentifier: xpubOrAddress,
    used: true,
    swapHistory: [],
    derivationMode,
    currency,
    index,
    nfts: [],
    freshAddress: xpubOrAddress,
    freshAddressPath,
    creationDate: new Date(),
    lastSyncDate: new Date(0),
    blockHeight: 0,
    balance: new BigNumber(0),
    spendableBalance: new BigNumber(0),
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: {
      HOUR: {
        latestDate: null,
        balances: [],
      },
      DAY: {
        latestDate: null,
        balances: [],
      },
      WEEK: {
        latestDate: null,
        balances: [],
      },
    },
    polkadotResources: {
      controller: "",
      stash: "",
      nonce: 0,
      lockedBalance: new BigNumber(0),
      unlockedBalance: new BigNumber(0),
      unlockingBalance: new BigNumber(0),
      unlockings: [],
      nominations: [],
      numSlashingSpans: 0,
    },
  };
};
