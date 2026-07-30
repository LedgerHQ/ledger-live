import { FeeNotLoaded } from "@ledgerhq/ledger-wallet-framework/errors";

import { bitcoinPickingStrategy } from "../../types";
import wallet, { TransactionInfo } from "@ledgerhq/wallet-btc/index";
import { fromTransactionRaw } from "../../transaction";
import { buildTransaction } from "../../buildTransaction";
import { buildAccountTx } from "../../buildAndSign";

jest.mock("../../buildAndSign");

import { createFixtureAccount, networkInfo } from "../../fixtures/common.fixtures";

jest.mock("../../getWalletAccount", () => ({
  getWalletAccount: jest.fn().mockReturnValue({
    xpub: {
      crypto: "bitcoin",
    },
    params: {
      currency: "bitcoin",
    },
  }),
}));

describe("buildTransaction", () => {
  const mockAccount = createFixtureAccount();
  const maxSpendable = 100000;
  const txInfo = {
    inputs: [],
    outputs: [],
    fee: 0,
    associatedDerivations: [],
    changeAddress: { address: "change-address", account: 1, index: 1 },
  } as TransactionInfo;

  beforeEach(() => {
    jest.clearAllMocks();
    wallet.estimateAccountMaxSpendable = jest.fn().mockResolvedValue(maxSpendable);
    (buildAccountTx as jest.Mock).mockResolvedValue(txInfo);
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

    const res = await buildTransaction(mockAccount, transaction);

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    expect(require("../../getWalletAccount").getWalletAccount).toHaveBeenCalledWith(mockAccount);
    expect(res).toEqual(txInfo);
  });
});
