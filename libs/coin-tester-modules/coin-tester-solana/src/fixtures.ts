import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { decodeAccountId } from "@ledgerhq/coin-framework/account";
import { getDerivationScheme, runDerivationScheme } from "@ledgerhq/coin-framework/derivation";
import { TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { SolanaAccount } from "@ledgerhq/coin-solana/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";

export const RECIPIENT = "Hj69wRzkrFuf1Nby4yzPEFHdsmQdMoVYjvDKZSLjZFEp";
export const SOLANA = getCryptoCurrencyById("solana");

export const makeAccount = (
  address: string,
  currency: CryptoCurrency,
  subAccounts: TokenAccount[] = [],
): SolanaAccount => {
  const id = `js:2:${currency.id}:${address}:solanaSub`;
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
    solanaResources: { stakes: [], unstakeReserve: new BigNumber(0) },
  };
};
