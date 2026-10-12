import BigNumber from "bignumber.js";
import { listCryptoCurrencies } from "@ledgerhq/ledger-wallet-framework/currencies";
import { emptyHistoryCache } from "@ledgerhq/ledger-wallet-framework/account/index";
import type { Account } from "@ledgerhq/types-live";

/** The resources of a bitcoin account, as Ledger Wallet keeps them (spendable outputs). */
type FixtureBitcoinResources = {
  utxos: Array<{
    hash: string;
    outputIndex: number;
    blockHeight: number | null | undefined;
    address: string | null | undefined;
    value: BigNumber;
    rbf: boolean;
    isChange: boolean;
  }>;
};

type FixtureBitcoinAccount = Account & { bitcoinResources: FixtureBitcoinResources };

export function createFixtureAccount(
  account?: Partial<FixtureBitcoinAccount>,
): FixtureBitcoinAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;

  const bitcoinResources: FixtureBitcoinResources = account?.bitcoinResources || {
    utxos: [],
  };

  const freshAddress = {
    address: "1fMK6i7CMDES1GNGDEMX5ddDaxbkjWPw1M",
    derivationPath: "derivation_path",
  };

  return {
    type: "Account",
    id: "E0A538D5-5EE7-4E37-BB57-F373B08B8580",
    seedIdentifier: "FD5EAFE3-8C7F-4565-ADFA-2A1A2067322A",
    derivationMode: "",
    index: 0,
    freshAddress: freshAddress.address,
    freshAddressPath: freshAddress.derivationPath,
    used: true,
    balance: account?.balance || new BigNumber(0),
    spendableBalance: account?.spendableBalance || new BigNumber(0),
    creationDate: new Date(),
    blockHeight: 100_000,
    currency,
    operationsCount: 0,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date(),
    balanceHistoryCache: emptyHistoryCache,
    swapHistory: [],

    bitcoinResources,
  };
}
