import { Operation, TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from "./index";
import networkApi from "../network/tzkt";
import { APIAccount } from "../network/types";

const logicGetTransactions = jest.fn();
const logicEstimateFeesMock = jest.fn(() => Promise.resolve({ estimatedFees: 300n }));
const logicCraftTransactinMock = jest.fn((_account: unknown, _transaction: { fee: bigint }) => {
  return { type: undefined, contents: undefined };
});

jest.mock("../logic", () => ({
  listOperations: async () => logicGetTransactions(),
  estimateFees: async () => logicEstimateFeesMock(),
  craftTransaction: (account: unknown, transaction: { fee: bigint }) =>
    logicCraftTransactinMock(account, transaction),
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

  const op: Operation<void> = {
    operationIndex: 0,
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
  beforeEach(() => {
    logicEstimateFeesMock.mockClear();
    logicCraftTransactinMock.mockClear();
  });

  it("should use estimated fees for a transaction when a user does not provide them", async () => {
    await api.craftTransaction({ type: "send" } as TransactionIntent<void>);
    expect(logicEstimateFeesMock).toHaveBeenCalledTimes(1);
    expect(logicCraftTransactinMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ fee: { fees: 300n.toString() } }),
    );
  });

  it.each([[1n], [50n], [99n]])(
    "should use user fees for a transaction when a user provide them",
    async (fees: bigint) => {
      await api.craftTransaction({ type: "send" } as TransactionIntent<void>, fees);
      expect(logicEstimateFeesMock).toHaveBeenCalledTimes(0);
      expect(logicCraftTransactinMock).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ fee: { fees: fees.toString() } }),
      );
    },
  );
});
