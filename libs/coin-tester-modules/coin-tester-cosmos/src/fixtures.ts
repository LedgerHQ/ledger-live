import BigNumber from "bignumber.js";
import { CosmosAccount } from "@ledgerhq/coin-cosmos/types/index";
import { decodeAccountId } from "@ledgerhq/ledger-wallet-framework/account";
import {
  getDerivationScheme,
  runDerivationScheme,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { TokenAccount } from "@ledgerhq/types-live";

export const makeAccount = (
  address: string,
  currency: CryptoCurrency,
  subAccounts: TokenAccount[] = [],
): CosmosAccount => {
  // Empty derivation-mode suffix matches the cosmos convention seen in
  // coin-cosmos/src/synchronisation.integ.test.ts (`js:2:cosmos:<addr>:`).
  const id = `js:2:${currency.id}:${address}:`;
  const { derivationMode, xpubOrAddress } = decodeAccountId(id);
  const scheme = getDerivationScheme({ derivationMode, currency });

  const freshAddressPath = runDerivationScheme(scheme, currency, {
    account: 0,
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
    index: 0,
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
      HOUR: { latestDate: null, balances: [] },
      DAY: { latestDate: null, balances: [] },
      WEEK: { latestDate: null, balances: [] },
    },
    cosmosResources: {
      delegations: [],
      redelegations: [],
      unbondings: [],
      delegatedBalance: new BigNumber(0),
      pendingRewardsBalance: new BigNumber(0),
      unbondingBalance: new BigNumber(0),
      withdrawAddress: "",
      sequence: 0,
    },
  };
};
