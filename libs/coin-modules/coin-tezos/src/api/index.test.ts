import { Operation } from "@ledgerhq/coin-framework/lib/api/types";
import { createApi } from "./index";

const logicGetTransactions = jest.fn();
jest.mock("../logic", () => ({
  listOperations: async () => {
    return logicGetTransactions();
  },
}));

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

  const op: Operation = {
    hash: "opHash",
    address: "tz1...",
    type: "transaction",
    value: BigInt(1000),
    fee: BigInt(100),
    block: {
      hash: "blockHash",
      height: 123456,
      time: new Date(),
    },
    senders: ["tz1Sender"],
    recipients: ["tz1Recipient"],
    date: new Date(),
    transactionSequenceNumber: 1,
  };

  it("stops iterating after 10 iterations", async () => {
    logicGetTransactions.mockResolvedValue([[op], "888"]);
    const [operations, token] = await api.listOperations("addr", { minHeight: 100 });
    expect(logicGetTransactions).toHaveBeenCalledTimes(10);
    expect(operations.length).toBe(10);
    expect(token).toEqual("888");
  });
});
