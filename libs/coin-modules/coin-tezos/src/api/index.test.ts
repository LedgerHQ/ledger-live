import type { Operation } from "@ledgerhq/coin-framework/api/types";
import type { APIAccount } from "../network/types";
import networkApi from "../network/tzkt";
import { createApi } from "./index";
import type { TezosAsset, TezosTransactionIntent } from "./types";

const DEFAULT_ESTIMATED_FEES = 300n;

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

jest
  .spyOn(networkApi, "getAccountByAddress")
  .mockImplementation((_adress: string) =>
    Promise.resolve({ type: "user", balance: 1000 } as APIAccount),
  );

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
    const [operations, token] = await api.listOperations("addr", { minHeight: 100 });
    expect(operations).toEqual([]);
    expect(token).toEqual("");
  });

  const op: Operation<TezosAsset> = {
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
    },
    type: "transaction",
    value: BigInt(1000),
    senders: ["tz1Sender"],
    recipients: ["tz1Recipient"],
  };

  it("stops iterating after 10 iterations", async () => {
    logicGetTransactions.mockResolvedValue([[op], "888"]);
    const [operations, token] = await api.listOperations("addr", { minHeight: 100 });
    expect(logicGetTransactions).toHaveBeenCalledTimes(10);
    expect(operations.length).toBe(10);
    expect(token).toEqual("888");
  });
});

describe("Testing craftTransaction function", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should use estimated fees when user does not provide them for crafting a transaction ", async () => {
    logicEstimateFees.mockResolvedValue({ estimatedFees: DEFAULT_ESTIMATED_FEES });
    await api.craftTransaction({ type: "send", sender: {} } as TezosTransactionIntent);
    expect(logicEstimateFees).toHaveBeenCalledTimes(1);
    expect(logicCraftTransactionMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ fee: { fees: DEFAULT_ESTIMATED_FEES.toString() } }),
    );
  });

  it.each([[1n], [50n], [99n]])(
    "should use custom user fees when user provides it for crafting a transaction",
    async (customFees: bigint) => {
      logicEstimateFees.mockResolvedValue({ estimatedFees: DEFAULT_ESTIMATED_FEES });
      await api.craftTransaction(
        { type: "send", sender: {} } as TezosTransactionIntent,
        customFees,
      );
      expect(logicEstimateFees).toHaveBeenCalledTimes(0);
      expect(logicCraftTransactionMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ fee: { fees: customFees.toString() } }),
      );
    },
  );
});

describe("Testing estimateFees function", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return estimation from logic module", async () => {
    logicEstimateFees.mockResolvedValue({ estimatedFees: DEFAULT_ESTIMATED_FEES });
    const result = await api.estimateFees({ type: "send", sender: {} } as TezosTransactionIntent);
    expect(result.value).toEqual(DEFAULT_ESTIMATED_FEES);
  });

  it("should throw taquito errors", async () => {
    logicEstimateFees.mockResolvedValue({ taquitoError: "test" });
    await expect(
      api.estimateFees({ type: "send", sender: {} } as TezosTransactionIntent),
    ).rejects.toThrow("Fees estimation failed: test");
  });
});
