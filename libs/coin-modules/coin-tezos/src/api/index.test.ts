import type { Operation } from "@ledgerhq/coin-framework/api/types";
import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";
import type { APIAccount } from "../network/types";
import networkApi from "../network/tzkt";
import { createApi } from "./index";

const DEFAULT_ESTIMATED_FEES = 300n;
const DEFAULT_GAS_LIMIT = 30n;
const DEFAULT_STORAGE_LIMIT = 40n;

const logicGetTransactions = jest.fn();
const logicEstimateFees = jest.fn();
const logicCraftTransactionMock = jest.fn(
  (_account: unknown, _transaction: { fee: { fees: string } }) => {
    return { type: undefined, contents: undefined };
  },
);

jest.mock("../logic", () => ({
  listOperations: async () => logicGetTransactions(),
  estimateFees: async () => logicEstimateFees(),
  craftTransaction: (account: unknown, transaction: { fee: { fees: string } }) =>
    logicCraftTransactionMock(account, transaction),
  rawEncode: () => Promise.resolve("tz1heMGVHQnx7ALDcDKqez8fan64Eyicw4DJ"),
}));

const mockGetTezosToolkit = jest.fn();
jest.mock("../logic/tezosToolkit", () => ({
  getTezosToolkit: () => mockGetTezosToolkit(),
}));

jest.spyOn(networkApi, "getAccountByAddress").mockResolvedValue({
  type: "user",
  balance: 1000,
  revealed: true,
  address: "tz1test",
  publicKey: "edpktest",
  counter: 0,
  delegationLevel: 0,
  delegationTime: "2021-01-01T00:00:00Z",
  numTransactions: 0,
  firstActivityTime: "2021-01-01T00:00:00Z",
} as APIAccount);

const api = createApi({
  baker: {
    url: "https://baker.example.com",
  },
  explorer: {
    url: "foo",
    maxTxQuery: 1,
  },
  node: {
    url: "bar",
  },
  fees: {
    minGasLimit: 1,
    minRevealGasLimit: 1,
    minStorageLimit: 1,
    minFees: 1,
    minEstimatedFees: 2,
  },
});

describe("get operations", () => {
  afterEach(() => {
    logicGetTransactions.mockClear();
  });

  it("could return no operation", async () => {
    logicGetTransactions.mockResolvedValue([[], ""]);
    const [operations, token] = await api.listOperations("addr", { minHeight: 100, order: "asc" });
    expect(operations).toEqual([]);
    expect(token).toEqual("");
  });

  const op: Operation = {
    id: "blockhash",
    asset: { type: "native" },
    tx: {
      hash: "opHash",
      fees: BigInt(100),
      block: {
        hash: "blockHash",
        height: 123456,
        time: new Date(),
      },
      date: new Date(),
      failed: false,
    },
    type: "transaction",
    value: BigInt(1000),
    senders: ["tz1Sender"],
    recipients: ["tz1Recipient"],
  };

  it("only does 1 iteration", async () => {
    logicGetTransactions.mockResolvedValue([[op], "888"]);
    const [operations, token] = await api.listOperations("addr", { minHeight: 100, order: "asc" });
    expect(logicGetTransactions).toHaveBeenCalledTimes(1);
    expect(operations.length).toBe(1);
    expect(token).toEqual("888");
  });
});

describe("craftTransaction", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("when suggested fee is above or below minFees floor", () => {
    it("craft transaction when default estimation is greater than minFees", async () => {
      const estimatedFees = 500n;
      logicEstimateFees.mockResolvedValue({
        estimatedFees,
        gasLimit: DEFAULT_GAS_LIMIT,
        storageLimit: DEFAULT_STORAGE_LIMIT,
        parameters: {
          gasLimit: DEFAULT_GAS_LIMIT,
          storageLimit: DEFAULT_STORAGE_LIMIT,
          txFee: 500n,
        },
      });
      await api.craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: "tz1test",
        recipient: "tz1recipient",
        amount: 1000n,
      } as TransactionIntent);
      expect(logicEstimateFees).toHaveBeenCalledTimes(1);
      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({ address: "tz1test" }),
        expect.objectContaining({
          fee: expect.objectContaining({
            fees: estimatedFees.toString(),
            gasLimit: DEFAULT_GAS_LIMIT.toString(),
            storageLimit: DEFAULT_STORAGE_LIMIT.toString(),
          }),
        }),
      );
    });

    it("craft transaction when default estimation is lesser than minFees", async () => {
      const estimatedFees = 50n;
      logicEstimateFees.mockResolvedValue({
        estimatedFees,
        gasLimit: DEFAULT_GAS_LIMIT,
        storageLimit: DEFAULT_STORAGE_LIMIT,
        parameters: {
          gasLimit: DEFAULT_GAS_LIMIT,
          storageLimit: DEFAULT_STORAGE_LIMIT,
          txFee: 50n,
        },
      });
      await api.craftTransaction({
        intentType: "transaction",
        type: "send",
        sender: "tz1test",
        recipient: "tz1recipient",
        amount: 1000n,
      } as TransactionIntent);
      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          fee: expect.objectContaining({ fees: estimatedFees.toString() }),
        }),
      );
    });
  });

  describe("with customFee", () => {
    it("craft transaction with customFee when default estimation is greater than customFee", async () => {
      const defaultEstimatedFees = 500n;
      const customFee = 100n;
      logicEstimateFees.mockResolvedValue({
        estimatedFees: defaultEstimatedFees,
        gasLimit: DEFAULT_GAS_LIMIT,
        storageLimit: DEFAULT_STORAGE_LIMIT,
        parameters: {
          gasLimit: DEFAULT_GAS_LIMIT,
          storageLimit: DEFAULT_STORAGE_LIMIT,
        },
      });
      await api.craftTransaction(
        {
          intentType: "transaction",
          type: "send",
          sender: "tz1test",
          recipient: "tz1recipient",
          amount: 1000n,
        } as TransactionIntent,
        { value: customFee },
      );
      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          fee: expect.objectContaining({ fees: customFee.toString() }),
        }),
      );
    });

    it("craft transaction with customFee when default estimation is lesser than customFee", async () => {
      const customFee = 500n;
      logicEstimateFees.mockResolvedValue({
        estimatedFees: 100n,
        gasLimit: DEFAULT_GAS_LIMIT,
        storageLimit: DEFAULT_STORAGE_LIMIT,
        parameters: {
          gasLimit: DEFAULT_GAS_LIMIT,
          storageLimit: DEFAULT_STORAGE_LIMIT,
        },
      });
      await api.craftTransaction(
        {
          intentType: "transaction",
          type: "send",
          sender: "tz1test",
          recipient: "tz1recipient",
          amount: 1000n,
        } as TransactionIntent,
        { value: customFee },
      );
      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          fee: expect.objectContaining({ fees: customFee.toString() }),
        }),
      );
    });

    it("craft transaction with customFee splits total for unrevealed delegate so total equals customFee", async () => {
      const minFees = 1000;
      const unrevealedSender = "tz2TaTpo31sAiX2HBJUTLLdUnqVJR4QjLy1V";
      const delegateRecipient = "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D";
      const totalCustomFee = BigInt(minFees * 2);

      const apiMinFees1000 = createApi({
        baker: { url: "https://baker.example.com" },
        explorer: { url: "foo", maxTxQuery: 1 },
        node: { url: "bar" },
        fees: {
          minGasLimit: 600,
          minRevealGasLimit: 300,
          minStorageLimit: 0,
          minFees,
          minEstimatedFees: minFees,
        },
      });

      const unrevealedAccount = {
        type: "user" as const,
        balance: 1000000,
        revealed: false,
        address: unrevealedSender,
        publicKey: "sppktest",
        counter: 0,
        delegationLevel: 0,
        delegationTime: "2021-01-01T00:00:00Z",
        numTransactions: 0,
        firstActivityTime: "2021-01-01T00:00:00Z",
      } as APIAccount;
      (networkApi.getAccountByAddress as jest.Mock)
        .mockResolvedValueOnce(unrevealedAccount)
        .mockResolvedValueOnce(unrevealedAccount);

      logicEstimateFees.mockResolvedValue({
        estimatedFees: totalCustomFee,
        fees: 1000n,
        gasLimit: 10000n,
        storageLimit: 0n,
        parameters: {
          gasLimit: 10000n,
          storageLimit: 0n,
          txFee: 1000n,
        },
      });

      await apiMinFees1000.craftTransaction(
        {
          intentType: "staking",
          type: "delegate",
          sender: unrevealedSender,
          senderPublicKey: "021bab48f41fc555e0fcf322a28e31b56f4369242f65324758ec8bbae3e84109a5",
          recipient: delegateRecipient,
          amount: 0n,
        } as TransactionIntent,
        { value: totalCustomFee },
      );

      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({ address: unrevealedSender }),
        expect.objectContaining({
          fee: expect.objectContaining({
            fees: String(minFees),
            gasLimit: "10000",
            storageLimit: "0",
          }),
        }),
      );
    });
  });
});

describe("estimateFees", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("when suggested fee is above or below minFees floor", () => {
    it("estimate fees when default estimation is greater than minFees", async () => {
      const estimatedFees = 500n;
      logicEstimateFees.mockResolvedValue({
        estimatedFees,
        gasLimit: DEFAULT_GAS_LIMIT,
        storageLimit: DEFAULT_STORAGE_LIMIT,
      });
      const result = await api.estimateFees({
        intentType: "transaction",
        type: "send",
        sender: "tz1test",
        recipient: "tz1recipient",
        amount: 1000n,
      } as TransactionIntent);
      expect(result.value).toBe(estimatedFees);
      expect(result.parameters?.gasLimit).toBe(DEFAULT_GAS_LIMIT);
      expect(result.parameters?.storageLimit).toBe(DEFAULT_STORAGE_LIMIT);
    });

    it("estimate fees when default estimation is lesser than minFees", async () => {
      const estimatedFees = 100n;
      logicEstimateFees.mockResolvedValue({
        estimatedFees,
        gasLimit: DEFAULT_GAS_LIMIT,
        storageLimit: DEFAULT_STORAGE_LIMIT,
      });
      const result = await api.estimateFees({
        intentType: "transaction",
        type: "send",
        sender: "tz1test",
        recipient: "tz1recipient",
        amount: 1000n,
      } as TransactionIntent);
      expect(result.value).toBe(estimatedFees);
      expect(result.parameters?.gasLimit).toBe(DEFAULT_GAS_LIMIT);
      expect(result.parameters?.storageLimit).toBe(DEFAULT_STORAGE_LIMIT);
    });
  });

  it("returns estimation from logic module", async () => {
    logicEstimateFees.mockResolvedValue({
      estimatedFees: DEFAULT_ESTIMATED_FEES,
      gasLimit: DEFAULT_GAS_LIMIT,
      storageLimit: DEFAULT_STORAGE_LIMIT,
    });
    const result = await api.estimateFees({
      intentType: "transaction",
      type: "send",
      sender: "tz1test",
      recipient: "tz1recipient",
      amount: 1000n,
    } as TransactionIntent);
    expect(result).toEqual({
      value: DEFAULT_ESTIMATED_FEES,
      parameters: {
        gasLimit: DEFAULT_GAS_LIMIT,
        storageLimit: DEFAULT_STORAGE_LIMIT,
      },
    });
  });

  it("should throw taquito errors", async () => {
    logicEstimateFees.mockResolvedValue({
      estimatedFees: DEFAULT_ESTIMATED_FEES,
      gasLimit: DEFAULT_GAS_LIMIT,
      storageLimit: DEFAULT_STORAGE_LIMIT,
      taquitoError: "test",
    });
    await expect(
      api.estimateFees({
        intentType: "transaction",
        type: "send",
        sender: "tz1test",
        recipient: "tz1recipient",
        amount: 1000n,
      } as TransactionIntent),
    ).rejects.toThrow("Fees estimation failed: test");
  });

  it("should not throw for delegate.unchanged errors", async () => {
    logicEstimateFees.mockResolvedValue({
      estimatedFees: DEFAULT_ESTIMATED_FEES,
      gasLimit: DEFAULT_GAS_LIMIT,
      storageLimit: DEFAULT_STORAGE_LIMIT,
      taquitoError: "proto.022-PsRiotum.delegate.unchanged",
    });
    const result = await api.estimateFees({
      intentType: "staking",
      type: "delegate",
      sender: "tz1test",
      recipient: "tz1validator",
      amount: 0n,
    } as TransactionIntent);

    expect(result).toEqual({
      value: DEFAULT_ESTIMATED_FEES,
      parameters: {
        gasLimit: DEFAULT_GAS_LIMIT,
        storageLimit: DEFAULT_STORAGE_LIMIT,
      },
    });
  });

  it("returns total estimation for unrevealed delegate when minFees applied (composite)", async () => {
    const unrevealedSender = "tz2TaTpo31sAiX2HBJUTLLdUnqVJR4QjLy1V";
    (networkApi.getAccountByAddress as jest.Mock).mockResolvedValueOnce({
      type: "user",
      balance: 1000000,
      revealed: false,
      address: unrevealedSender,
      publicKey: undefined,
      counter: 0,
      delegationLevel: 0,
      delegationTime: "2021-01-01T00:00:00Z",
      numTransactions: 0,
      firstActivityTime: "2021-01-01T00:00:00Z",
    } as APIAccount);

    const expectedTotalFees = 2000n;
    logicEstimateFees.mockResolvedValue({
      estimatedFees: expectedTotalFees,
      fees: 1000n,
      gasLimit: DEFAULT_GAS_LIMIT,
      storageLimit: DEFAULT_STORAGE_LIMIT,
    });

    const result = await api.estimateFees({
      intentType: "staking",
      type: "delegate",
      sender: unrevealedSender,
      recipient: "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D",
      amount: 0n,
    } as TransactionIntent);

    expect(result.value).toBe(expectedTotalFees);
    expect(result.parameters.gasLimit).toBe(DEFAULT_GAS_LIMIT);
    expect(result.parameters.storageLimit).toBe(DEFAULT_STORAGE_LIMIT);
  });

  it("fallback when Taquito throws Public key not found returns total with minFees for reveal (unrevealed)", async () => {
    const unrevealedSender = "tz2TaTpo31sAiX2HBJUTLLdUnqVJR4QjLy1V";
    const delegateRecipient = "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D";
    const minFees = 1000;

    const apiMinFees1000 = createApi({
      baker: { url: "https://baker.example.com" },
      explorer: { url: "foo", maxTxQuery: 1 },
      node: { url: "bar" },
      fees: {
        minGasLimit: 600,
        minRevealGasLimit: 300,
        minStorageLimit: 0,
        minFees,
        minEstimatedFees: minFees,
      },
    });

    logicEstimateFees.mockImplementation(() => Promise.reject(new Error("Public key not found")));

    const defaultUserForTry = {
      type: "user" as const,
      balance: 1000,
      revealed: true,
      address: unrevealedSender,
      publicKey: "edpktest",
      counter: 0,
      delegationLevel: 0,
      delegationTime: "2021-01-01T00:00:00Z",
      numTransactions: 0,
      firstActivityTime: "2021-01-01T00:00:00Z",
    } as APIAccount;
    const recipientAccount = {
      type: "user" as const,
      balance: 1000000,
      address: delegateRecipient,
      counter: 0,
      delegationLevel: 0,
      delegationTime: "2021-01-01T00:00:00Z",
      numTransactions: 0,
      firstActivityTime: "2021-01-01T00:00:00Z",
    } as APIAccount;
    const senderUnrevealedAccount = {
      type: "user" as const,
      balance: 1000000,
      revealed: false,
      address: unrevealedSender,
      publicKey: undefined,
      counter: 0,
      delegationLevel: 0,
      delegationTime: "2021-01-01T00:00:00Z",
      numTransactions: 0,
      firstActivityTime: "2021-01-01T00:00:00Z",
    } as APIAccount;
    (networkApi.getAccountByAddress as jest.Mock)
      .mockImplementationOnce(() => Promise.resolve(defaultUserForTry))
      .mockImplementationOnce(() => Promise.resolve(recipientAccount))
      .mockImplementationOnce(() => Promise.resolve(senderUnrevealedAccount));

    mockGetTezosToolkit.mockReturnValueOnce({
      estimate: {
        transfer: jest.fn().mockResolvedValue({
          suggestedFeeMutez: 100,
          gasLimit: 10000,
          storageLimit: 0,
          burnFeeMutez: 0,
          opSize: 100,
        }),
      },
    });

    const result = await apiMinFees1000.estimateFees({
      intentType: "staking",
      type: "delegate",
      sender: unrevealedSender,
      recipient: delegateRecipient,
      amount: 0n,
    } as TransactionIntent);

    expect(result.value).toBe(2000n);
    expect(result.parameters?.txFee).toBe(1000n);
    expect(result.parameters?.gasLimit).toBe(10000n);
    expect(result.parameters?.storageLimit).toBe(0n);

    logicEstimateFees.mockReset();
  });
});
