import { FeeNotLoaded } from "@ledgerhq/errors";

import { bitcoinPickingStrategy } from "../../types";
import wallet from "../../wallet-btc";
import { fromTransactionRaw } from "../../transaction";
import { buildTransaction } from "../../buildTransaction";

import { createFixtureAccount, networkInfo } from "../fixtures/common.fixtures";

jest.mock("../../wallet-btc", () => ({
  ...jest.requireActual("../../wallet-btc"),
  getWalletAccount: jest.fn().mockReturnValue({
    xpub: {
      crypto: "bitcoin",
    },
  }),
}));


describe("buildTransaction", () => {
  const mockAccount = createFixtureAccount();
  const maxSpendable = 100000;

  beforeEach(() => {
    jest.clearAllMocks();
    // getWalletAccount.mockReturnValue(walletAccount);
    wallet.estimateAccountMaxSpendable = jest.fn().mockResolvedValue(maxSpendable);
    wallet.buildAccountTx = jest.fn().mockResolvedValue({});
  });
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

    expect(require("../../wallet-btc").getWalletAccount).toHaveBeenCalledWith(mockAccount);
  });
});
