import { genericPrepareTransaction } from "../prepareTransaction";
import { getAlpacaApi } from "../alpaca";
import { transactionToIntent } from "../utils";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "../types";
import { setupMockCryptoAssetsStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import { TokenCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("../alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

jest.mock("../utils", () => ({
  transactionToIntent: jest.fn(),
}));

describe("genericPrepareTransaction", () => {
  const network = "testnet";
  const kind = "local";

  const account = {
    id: "test-account",
    address: "0xabc",
    currency: { id: "ethereum" },
  } as any;

  const baseTransaction = {
    amount: new BigNumber(100_000),
    fees: new BigNumber(500),
    recipient: "0xrecipient",
    family: "family",
  };

  const txIntent = { mock: "intent" };

  beforeEach(() => {
    jest.clearAllMocks();
    (transactionToIntent as jest.Mock).mockReturnValue(txIntent);
  });

  it("updates fees if they differ", async () => {
    const newFee = new BigNumber(700);

    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: newFee }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(account, { ...baseTransaction });

    expect((result as any).fees.toString()).toBe(newFee.toString());
    expect(transactionToIntent).toHaveBeenCalledWith(
      account,
      expect.objectContaining(baseTransaction),
      undefined,
    );
  });

  it("returns original transaction if fees are the same", async () => {
    const sameFee = baseTransaction.fees;

    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: sameFee }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(account, baseTransaction);

    expect(result).toBe(baseTransaction);
  });

  it("sets fee if original fees are undefined", async () => {
    const newFee = new BigNumber(1234);
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: newFee }),
    });

    const txWithoutFees = { ...baseTransaction, fees: undefined as any };
    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(account, txWithoutFees);

    expect((result as any).fees.toString()).toBe(newFee.toString());
    expect(result).not.toBe(txWithoutFees);
  });

  it("returns original if fees are BigNumber-equal but different instance", async () => {
    const sameValue = new BigNumber(baseTransaction.fees.toString()); // different instance
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: sameValue }),
    });

    const prepareTransaction = genericPrepareTransaction(network, kind);
    const result = await prepareTransaction(account, baseTransaction);

    expect(result).toBe(baseTransaction); // still same reference
  });

  it.each([
    ["type", 2, 2],
    ["storageLimit", 300n, new BigNumber(300)],
    ["gasLimit", 300n, new BigNumber(300)],
    ["gasPrice", 300n, new BigNumber(300)],
    ["maxFeePerGas", 300n, new BigNumber(300)],
    ["maxPriorityFeePerGas", 300n, new BigNumber(300)],
    ["additionalFees", 300n, new BigNumber(300)],
  ])(
    "propagates %s from estimation parameters",
    async (parameterName, parameterValue, expectedValue) => {
      (getAlpacaApi as jest.Mock).mockReturnValue({
        estimateFees: jest.fn().mockResolvedValue({
          value: new BigNumber(491),
          parameters: { [parameterName]: parameterValue },
        }),
      });

      const txWithoutCustomFees = { ...baseTransaction, customFees: undefined };
      const prepareTransaction = genericPrepareTransaction(network, kind);
      const result = await prepareTransaction(account, txWithoutCustomFees);

      expect(result).toEqual(
        expect.objectContaining({
          fees: new BigNumber(491),
          [parameterName]: expectedValue,
          customFees: {
            parameters: {
              fees: undefined,
            },
          },
        }),
      );
    },
  );

  it("estimates using the token account spendable balance when sending all amount", async () => {
    const estimateFees = jest.fn().mockResolvedValue({ value: new BigNumber(50) });
    (transactionToIntent as jest.Mock).mockImplementation((_, transaction) => ({
      amount: BigInt(transaction.amount.toFixed()),
    }));
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees,
      validateIntent: intent => Promise.resolve({ amount: intent.amount }),
    });
    const prepareTransaction = genericPrepareTransaction(network, kind);

    await prepareTransaction(
      {
        ...account,
        subAccounts: [{ id: "test-sub-account", spendableBalance: new BigNumber(100) }],
      },
      {
        subAccountId: "test-sub-account",
        useAllAmount: true,
        amount: new BigNumber(0),
      } as GenericTransaction,
    );

    expect(estimateFees).toHaveBeenCalledWith(expect.objectContaining({ amount: 100n }), {});
  });

  it("fills 'assetOwner' and 'assetReference' from 'subAccountId' for retro compatibility", async () => {
    setupMockCryptoAssetsStore({
      findTokenById: tokenId =>
        Promise.resolve(tokenId === "usdc" ? ({ id: tokenId } as TokenCurrency) : undefined),
    });
    (getAlpacaApi as jest.Mock).mockReturnValue({
      estimateFees: () => Promise.resolve({ value: 0n }),
      getAssetFromToken: (token, owner) =>
        token.id === "usdc" ? { assetOwner: owner, assetReference: token.id } : undefined,
    });
    const prepareTransaction = genericPrepareTransaction(network, kind);

    await prepareTransaction(
      {
        ...account,
        freshAddress: "test-account-address",
        subAccounts: [{ id: "test-sub-account+usdc" }],
      },
      {
        subAccountId: "test-sub-account+usdc",
        amount: new BigNumber(10),
      } as GenericTransaction,
    );

    expect(transactionToIntent).toHaveBeenCalledWith(
      {
        ...account,
        freshAddress: "test-account-address",
        subAccounts: [{ id: "test-sub-account+usdc" }],
      },
      {
        subAccountId: "test-sub-account+usdc",
        amount: new BigNumber(10),
        assetOwner: "test-account-address",
        assetReference: "usdc",
      },
      undefined,
    );
  });
});
