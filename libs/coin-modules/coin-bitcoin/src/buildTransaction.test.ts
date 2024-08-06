import { TaprootNotActivated } from "./errors";
import { getTransactionStatus } from "./getTransactionStatus";
import { BigNumber } from "bignumber.js";
// import { createFixtureAccount } from './hw-signMessage.test';
import { DatasetTest } from "@ledgerhq/types-live";
import { BitcoinAccount, BitcoinResources, NetworkInfoRaw, Transaction, bitcoinPickingStrategy } from "./types";
import wallet, {
  Account,
  BitcoinLikeWallet,
  DerivationModes,
  getWalletAccount,
} from "./wallet-btc";

import bitcoin from "./datasets/bitcoin";
import { fromTransactionRaw } from "./transaction";
import { listCryptoCurrencies } from "@ledgerhq/cryptoassets/currencies";
import { emptyHistoryCache } from "@ledgerhq/coin-framework/account/index";
import Xpub from "./wallet-btc/xpub";
import BitcoinLikeStorage from "./wallet-btc/storage";
import BitcoinLikeExplorer from "./wallet-btc/explorer";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { ICrypto } from "./wallet-btc/crypto/types";
import { buildTransaction } from "./buildTransaction";
import { FeeNotLoaded } from "@ledgerhq/errors";

const networkInfo: NetworkInfoRaw = {
  family: "bitcoin",
  feeItems: {
    items: [
      {
        key: "0",
        speed: "high",
        feePerByte: "3",
      },
      {
        key: "1",
        speed: "standard",
        feePerByte: "2",
      },
      {
        key: "2",
        speed: "low",
        feePerByte: "1",
      },
    ],
    defaultFeePerByte: "1",
  },
};
export function createFixtureAccount(account?: Partial<BitcoinAccount>): BitcoinAccount {
  const currency = listCryptoCurrencies(true).find(c => c.id === "bitcoin")!;
  // const wallet = new BitcoinLikeWallet();

  const bitcoinResources: BitcoinResources = account?.bitcoinResources || {
    utxos: [],
    // walletAccount:
    // walletAccount: mockWalletAccount,
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
jest.mock("./wallet-btc", () => ({
  ...jest.requireActual("./wallet-btc"),
  getWalletAccount: jest.fn().mockReturnValue({
    xpub: {
      crypto: "bitcoin",
    },
  }),
}));


describe("buildTransaction", () => {
  const mockAccount = createFixtureAccount();
  const maxSpendable = 100000;
  console.log({ mockAccount });

  beforeEach(() => {
    jest.clearAllMocks();
    // getWalletAccount.mockReturnValue(walletAccount);
    wallet.estimateAccountMaxSpendable = jest.fn().mockResolvedValue(maxSpendable);
    wallet.buildAccountTx = jest.fn().mockResolvedValue({});
  });
  // console.log({ dataset, btc: dataset.currencies.bitcoin?.accounts?.[0].transactions?.[0] });
  it("should throw FeeNotLoaded if feePerByte is not provided", async () => {
    const transaction = fromTransactionRaw({
      family: "bitcoin",
      recipient: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
      amount: "999",
      feePerByte: null,
      networkInfo,
      rbf: false,
      utxoStrategy: {
        strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
        excludeUTXOs: [],
      },
    });

    await expect(buildTransaction(mockAccount, transaction)).rejects.toThrow(FeeNotLoaded);
  });

  it("should call getWalletAccount with the provided account", async () => {
    const transaction = fromTransactionRaw({
      family: "bitcoin",
      recipient: "1Cz2ZXb6Y6AacXJTpo4RBjQMLEmscuxD8e",
      amount: "999",
      feePerByte: "1",
      networkInfo,
      rbf: false,
      utxoStrategy: {
        strategy: bitcoinPickingStrategy.MERGE_OUTPUTS,
        excludeUTXOs: [],
      },
    });

    await buildTransaction(mockAccount, transaction);

    expect(require("./wallet-btc").getWalletAccount).toHaveBeenCalledWith(mockAccount);
  });
});
