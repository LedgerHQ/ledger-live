import { genericPrepareTransaction } from "../prepareTransaction";
import { getCoinModuleApi } from "../api";
import { getBridgeApi } from "../bridge";
import { transactionToIntent } from "../utils";
import BigNumber from "bignumber.js";
import { GenericTransaction } from "../types";
import { setCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { TokenCurrency } from "@domain/entity-currency-token";
import { decodeTokenAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";

jest.mock("../api", () => ({
  getCoinModuleApi: jest.fn(),
}));
jest.mock("../bridge", () => ({
  getBridgeApi: jest.fn(),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/account/index", () => {
  const actual = jest.requireActual("@ledgerhq/ledger-wallet-framework/account/index");
  return {
    ...actual,
    decodeTokenAccountId: jest.fn(actual.decodeTokenAccountId),
  };
});

jest.mock("../utils", () => ({
  ...jest.requireActual("../utils"),
  transactionToIntent: jest.fn(),
  extractBalances: jest.fn(),
}));

describe("genericPrepareTransaction", () => {
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

  beforeEach(() => {
    jest.clearAllMocks();
    setCryptoAssetsStore({
      findTokenById: () => Promise.resolve(undefined),
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });
    (transactionToIntent as jest.Mock).mockReturnValue({ mock: "intent" });
    (getBridgeApi as jest.Mock).mockResolvedValue({
      getAssetFromToken: jest.fn().mockReturnValue(undefined),
    });
  });

  it("updates fees if they differ", async () => {
    const newFee = new BigNumber(700);

    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: newFee }),
    });

    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, { ...baseTransaction });

    expect((result as any).fees.toString()).toBe(newFee.toString());
    expect(transactionToIntent).toHaveBeenCalledWith(
      account,
      expect.objectContaining(baseTransaction),
      undefined,
      undefined,
    );
  });

  it("returns original transaction if fees are the same", async () => {
    const sameFee = baseTransaction.fees;

    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: sameFee }),
    });

    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, baseTransaction);

    expect(result).toBe(baseTransaction);
  });

  it("sets fee if original fees are undefined", async () => {
    const newFee = new BigNumber(1234);
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: newFee }),
    });

    const txWithoutFees = { ...baseTransaction, fees: undefined as any };
    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, txWithoutFees);

    expect((result as any).fees.toString()).toBe(newFee.toString());
    expect(result).not.toBe(txWithoutFees);
  });

  it("returns original if fees are BigNumber-equal but different instance", async () => {
    const sameValue = new BigNumber(baseTransaction.fees.toString()); // different instance
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({ value: sameValue }),
    });

    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, baseTransaction);

    expect(result).toBe(baseTransaction); // still same reference
  });

  it("propagates gasOptions from estimation parameters", async () => {
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({
        value: new BigNumber(491),
        parameters: {
          gasOptions: {
            slow: { maxFeePerGas: 20n, maxPriorityFeePerGas: 2n, nextBaseFee: 15n },
            medium: { maxFeePerGas: 24n, maxPriorityFeePerGas: 3n, nextBaseFee: 18n },
            fast: { maxFeePerGas: 30n, maxPriorityFeePerGas: 5n, nextBaseFee: 22n },
          },
        },
      }),
    });

    const txWithoutCustomFees = { ...baseTransaction, customFees: undefined };
    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, txWithoutCustomFees);

    expect(result).toEqual(
      expect.objectContaining({
        fees: new BigNumber(491),
        gasOptions: {
          slow: {
            gasPrice: null,
            maxFeePerGas: new BigNumber(20),
            maxPriorityFeePerGas: new BigNumber(2),
            nextBaseFee: new BigNumber(15),
          },
          medium: {
            gasPrice: null,
            maxFeePerGas: new BigNumber(24),
            maxPriorityFeePerGas: new BigNumber(3),
            nextBaseFee: new BigNumber(18),
          },
          fast: {
            gasPrice: null,
            maxFeePerGas: new BigNumber(30),
            maxPriorityFeePerGas: new BigNumber(5),
            nextBaseFee: new BigNumber(22),
          },
        },
      }),
    );
  });

  it("does not set gasOptions when estimation parameters omit them", async () => {
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({
        value: new BigNumber(491),
        parameters: { gasLimit: 21000n },
      }),
    });

    const txWithoutCustomFees = { ...baseTransaction, customFees: undefined };
    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, txWithoutCustomFees);

    expect(result).toEqual(
      expect.objectContaining({
        fees: new BigNumber(491),
        gasLimit: new BigNumber(21000),
      }),
    );
    expect(result).not.toHaveProperty("gasOptions");
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
      (getCoinModuleApi as jest.Mock).mockReturnValue({
        estimateFees: jest.fn().mockResolvedValue({
          value: new BigNumber(491),
          parameters: { [parameterName]: parameterValue },
        }),
      });

      const txWithoutCustomFees = { ...baseTransaction, customFees: undefined };
      const prepareTransaction = genericPrepareTransaction("testnet", "local");
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

  it("clears orphaned EIP-1559 fee fields when estimation returns null", async () => {
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({
        value: new BigNumber(491),
        parameters: {
          type: 0,
          gasPrice: 20_000_000_000n,
          maxFeePerGas: null,
          maxPriorityFeePerGas: null,
        },
      }),
    });

    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, {
      ...baseTransaction,
      type: 2,
      maxFeePerGas: new BigNumber(0),
      maxPriorityFeePerGas: new BigNumber(0),
      customFees: undefined,
    } as GenericTransaction);

    expect(result).toEqual(
      expect.objectContaining({
        type: 0,
        gasPrice: new BigNumber(20_000_000_000),
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      }),
    );
  });

  it("does not clear fee fields when estimation omits them", async () => {
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({
        value: new BigNumber(491),
        parameters: { gasLimit: 21000n },
      }),
    });

    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, {
      ...baseTransaction,
      maxFeePerGas: new BigNumber(24),
      maxPriorityFeePerGas: new BigNumber(3),
      customFees: undefined,
    } as GenericTransaction);

    expect(result).toEqual(
      expect.objectContaining({
        maxFeePerGas: new BigNumber(24),
        maxPriorityFeePerGas: new BigNumber(3),
        gasLimit: new BigNumber(21000),
      }),
    );
  });

  it("does not propagate the custom gas limit", async () => {
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: jest.fn().mockResolvedValue({
        value: 100000n,
        parameters: { gasLimit: 22000n }, // custom gasLimit in parameter
      }),
    });

    const txWithoutCustomFees = {
      ...baseTransaction,
      gasLimit: new BigNumber(21000),
      customGasLimit: new BigNumber(22000),
    };
    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, txWithoutCustomFees);

    expect(result).toEqual(
      expect.objectContaining({
        fees: new BigNumber(100000),
        gasLimit: new BigNumber(21000),
        customGasLimit: new BigNumber(22000),
      }),
    );
  });

  it("uses customFees.parameters.fees without calling estimateFees", async () => {
    const estimateFees = jest.fn();
    (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees });

    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(account, {
      ...baseTransaction,
      customFees: { parameters: { fees: new BigNumber(900) } },
    } as GenericTransaction);

    expect(estimateFees).not.toHaveBeenCalled();
    expect((result as any).fees.toString()).toBe("900");
  });

  it("keeps the custom fee value but still fetches coin parameters on send-max", async () => {
    // a custom total fee overrides only the value; additionalFees still come from estimateFees
    const estimateFees = jest
      .fn()
      .mockResolvedValue({ value: 50n, parameters: { additionalFees: 100n } });
    (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees });

    const prepareTransaction = genericPrepareTransaction("testnet", "local");
    const result = await prepareTransaction(
      { ...account, spendableBalance: new BigNumber(1_000_000) },
      {
        ...baseTransaction,
        customFees: { parameters: { fees: new BigNumber(900) } },
        mode: "send",
        useAllAmount: true,
      } as GenericTransaction,
    );

    expect(estimateFees).toHaveBeenCalled();
    expect((result as any).amount.toString()).toBe("999000");
  });

  describe("useAllAmount (send-max) amount", () => {
    const fundedAccount = {
      ...account,
      spendableBalance: new BigNumber(1_000_000_000),
    };

    it("computes delegate send-max from reserve/amountScale params, without validateIntent", async () => {
      const estimateFees = jest.fn().mockResolvedValue({
        value: new BigNumber(100),
        parameters: { reserve: 5500n, amountScale: 1000n },
      });
      const validateIntent = jest.fn();
      (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees, validateIntent });

      const prepareTransaction = genericPrepareTransaction("testnet", "local");
      const result = await prepareTransaction(fundedAccount, {
        ...baseTransaction,
        mode: "delegate",
        useAllAmount: true,
      } as GenericTransaction);

      expect((result as any).amount.toString()).toBe("999994000");
      expect(validateIntent).not.toHaveBeenCalled();
    });

    it("computes the send-max amount for non-delegation modes with useAllAmount", async () => {
      const estimateFees = jest.fn().mockResolvedValue({ value: new BigNumber(1_200_000) });
      (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees });

      const prepareTransaction = genericPrepareTransaction("testnet", "local");
      const result = await prepareTransaction(fundedAccount, {
        ...baseTransaction,
        mode: "send",
        useAllAmount: true,
      } as GenericTransaction);

      expect((result as any).amount.toString()).toBe("998800000");
    });

    it("uses parameters.amount when the coin module provides it", async () => {
      const estimateFees = jest.fn().mockResolvedValue({
        value: new BigNumber(100),
        parameters: { amount: 12345n },
      });
      (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees });

      const prepareTransaction = genericPrepareTransaction("testnet", "local");
      const result = await prepareTransaction(fundedAccount, {
        ...baseTransaction,
        mode: "send",
        useAllAmount: true,
      } as GenericTransaction);

      expect((result as any).amount.toString()).toBe("12345");
    });

    it("subtracts funds committed by pending native operations from the send-max", async () => {
      const estimateFees = jest.fn().mockResolvedValue({ value: new BigNumber(1_200_000) });
      (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees });

      const prepareTransaction = genericPrepareTransaction("testnet", "local");
      const result = await prepareTransaction(
        {
          ...fundedAccount,
          // pending OUT send commits its value + fee against the native balance until next sync
          pendingOperations: [
            { type: "OUT", value: new BigNumber(10_000_000), fee: new BigNumber(1_200_000) },
          ],
        },
        {
          ...baseTransaction,
          mode: "send",
          useAllAmount: true,
        } as GenericTransaction,
      );

      // 1000000000 - (10000000 + 1200000) pending - 1200000 fee
      expect((result as any).amount.toString()).toBe("987600000");
    });

    it("refreshes the send-max amount even when fees are unchanged", async () => {
      // fees already equal the estimation, so the early return path must still set the amount
      const estimateFees = jest.fn().mockResolvedValue({ value: new BigNumber(500) });
      (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees });

      const prepareTransaction = genericPrepareTransaction("testnet", "local");
      const result = await prepareTransaction(fundedAccount, {
        ...baseTransaction,
        fees: new BigNumber(500),
        amount: new BigNumber(0),
        mode: "send",
        useAllAmount: true,
      } as GenericTransaction);

      expect((result as any).amount.toString()).toBe("999999500");
    });
  });

  it("uses the token account spendable balance when sending all amount", async () => {
    (decodeTokenAccountId as jest.Mock).mockResolvedValueOnce({
      accountId: "test-sub-account",
      token: undefined,
    });
    const estimateFees = jest.fn().mockResolvedValue({ value: new BigNumber(50) });
    (transactionToIntent as jest.Mock).mockImplementation((_, transaction) => ({
      amount: BigInt(transaction.amount.toFixed()),
    }));
    (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees });
    const prepareTransaction = genericPrepareTransaction("testnet", "local");

    const result = await prepareTransaction(
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
    expect((result as any).amount.toString()).toBe("100");
  });

  it("subtracts pending token operations from the token send-max", async () => {
    (decodeTokenAccountId as jest.Mock).mockResolvedValueOnce({
      accountId: "test-sub-account",
      token: undefined,
    });
    const estimateFees = jest.fn().mockResolvedValue({ value: new BigNumber(50) });
    (transactionToIntent as jest.Mock).mockImplementation((_, transaction) => ({
      amount: BigInt(transaction.amount.toFixed()),
    }));
    (getCoinModuleApi as jest.Mock).mockReturnValue({ estimateFees });
    const prepareTransaction = genericPrepareTransaction("testnet", "local");

    const result = await prepareTransaction(
      {
        ...account,
        subAccounts: [
          {
            id: "test-sub-account",
            spendableBalance: new BigNumber(100),
            pendingOperations: [{ type: "OUT", value: new BigNumber(30) }],
          },
        ],
      },
      {
        subAccountId: "test-sub-account",
        useAllAmount: true,
        amount: new BigNumber(0),
      } as GenericTransaction,
    );

    // 100 token spendable - 30 committed by the pending token send
    expect((result as any).amount.toString()).toBe("70");
  });

  it("fills 'assetOwner' and 'assetReference' from 'subAccountId' for retro compatibility", async () => {
    setCryptoAssetsStore({
      findTokenById: tokenId =>
        Promise.resolve(tokenId === "usdc" ? ({ id: tokenId } as TokenCurrency) : undefined),
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    });
    (getCoinModuleApi as jest.Mock).mockReturnValue({
      estimateFees: () => Promise.resolve({ value: 0n }),
    });
    (getBridgeApi as jest.Mock).mockResolvedValue({
      getAssetFromToken: jest.fn().mockImplementation((token: TokenCurrency, owner: string) => ({
        assetOwner: owner,
        assetReference: token.id,
      })),
    });
    const prepareTransaction = genericPrepareTransaction("testnet", "local");

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
      undefined,
    );
  });
});
