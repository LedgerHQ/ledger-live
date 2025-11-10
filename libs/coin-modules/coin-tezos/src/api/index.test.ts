import type { Operation } from "@ledgerhq/coin-framework/api/types";
import type { APIAccount } from "../network/types";
import networkApi from "../network/tzkt";
import { createApi } from "./index";
import { TransactionIntent } from "@ledgerhq/coin-framework/api/types";

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

describe("Testing craftTransaction function", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should use estimated fees when user does not provide them for crafting a transaction ", async () => {
    logicEstimateFees.mockResolvedValue({
      estimatedFees: DEFAULT_ESTIMATED_FEES,
      gasLimit: DEFAULT_GAS_LIMIT,
      storageLimit: DEFAULT_STORAGE_LIMIT,
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
          fees: DEFAULT_ESTIMATED_FEES.toString(),
          gasLimit: DEFAULT_GAS_LIMIT.toString(),
          storageLimit: DEFAULT_STORAGE_LIMIT.toString(),
        }),
      }),
    );
  });

  it.each([[1n], [50n], [99n]])(
    "should use custom user fees when user provides it for crafting a transaction",
    async (customFees: bigint) => {
      logicEstimateFees.mockResolvedValue({
        estimatedFees: DEFAULT_ESTIMATED_FEES,
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
        {
          value: customFees,
        },
      );
      expect(logicEstimateFees).toHaveBeenCalledTimes(1);
      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          fee: {
            fees: customFees.toString(),
            gasLimit: DEFAULT_GAS_LIMIT.toString(),
            storageLimit: DEFAULT_STORAGE_LIMIT.toString(),
          },
        }),
      );
    },
  );
});

describe("Testing estimateFees function", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return estimation from logic module", async () => {
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
});
