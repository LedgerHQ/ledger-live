import { API } from "./api";
import { fetchAllTransactions, preserveInitialOperationsDate } from "./synchronisation";
import { ethereum2 } from "./datasets/ethereum2";
import { OperationRaw } from "@ledgerhq/types-live";
import { fromAccountRaw, fromOperationRaw } from "../../account";
import { setSupportedCurrencies } from "../../currencies";

setSupportedCurrencies(["ethereum"]);

describe("fetchAllTransactions", () => {
  const apiMock = {
    getTransactions: jest.fn(),
  } as unknown as API;

  const sampleAddress = "toto";

  const sampleBlockHeight = 42;

  let getTransactionsSpy: jest.SpyInstance;

  beforeEach(() => {
    getTransactionsSpy = jest.spyOn(apiMock, "getTransactions");
  });

  afterEach(() => {
    getTransactionsSpy.mockReset();
  });

  it("should keep calling getTransactions until token is null", async () => {
    getTransactionsSpy.mockReturnValueOnce(Promise.resolve({ txs: [], nextPageToken: "token1" }));
    getTransactionsSpy.mockReturnValueOnce(Promise.resolve({ txs: [], nextPageToken: "token2" }));
    getTransactionsSpy.mockReturnValueOnce(Promise.resolve({ txs: [], nextPageToken: null }));
    await fetchAllTransactions(apiMock, sampleAddress, sampleBlockHeight);
    expect(getTransactionsSpy).toHaveBeenCalledTimes(3);
  });

  it("should call getTransactions once if token is null", async () => {
    getTransactionsSpy.mockReturnValueOnce(Promise.resolve({ txs: [], nextPageToken: null }));
    await fetchAllTransactions(apiMock, sampleAddress, sampleBlockHeight);
    expect(getTransactionsSpy).toHaveBeenCalledTimes(1);
  });

  it("should accumulate txs between calls", async () => {
    getTransactionsSpy.mockReturnValueOnce(
      Promise.resolve({
        txs: [{ hash: "1" }, { hash: "2" }],
        nextPageToken: "token1",
      }),
    );
    getTransactionsSpy.mockReturnValueOnce(
      Promise.resolve({ txs: [{ hash: "3" }], nextPageToken: null }),
    );
    const txs = await fetchAllTransactions(apiMock, sampleAddress, sampleBlockHeight);
    expect(txs.length).toEqual(3);
  });
});

describe("preserveInitialOperationsDate", () => {
  const operation: OperationRaw = {
    id: "1",
    hash: "hash1",
    type: "OUT",
    value: "1",
    fee: "string",
    senders: ["0x789d2f10826BF8f3a56Ec524359bBA4e738Af5bF"],
    recipients: ["0xdA9EDcC3CF66bc18050dB55D376407Cf85e0617B"],
    blockHeight: 10042069,
    blockHash: "0x00000000000000000000000000000000000Th1sH4shSh0u1dN0t3x1sTOnCh4iN",
    transactionSequenceNumber: 1,
    date: "May-11-2020 01:50:10 UTC",
    extra: {},
    accountId: ethereum2.id,
  };
  const operation1 = {
    ...operation,
    id: "1",
    hash: "hash1",
    date: "2023-04-01",
  };
  const operation2 = {
    ...operation,
    id: "2",
    hash: "hash2",
    date: "2023-04-02",
  };
  const operation3 = {
    ...operation,
    id: "3",
    hash: "hash2",
    date: "2023-04-01",
  };
  const operation4 = {
    ...operation,
    id: "4",
    hash: "hash4",
    date: "2023-04-01",
  };
  const newOps = [
    fromOperationRaw(operation1, ethereum2.id),
    fromOperationRaw(operation2, ethereum2.id),
  ];
  it("should update operations date in newOps with initial date in existing account", () => {
    const account = fromAccountRaw({
      ...ethereum2,
      blockHeight: 10042069,
      syncHash: "NotImportant",
      operations: [operation3],
      operationsCount: 1,
    });
    const result = preserveInitialOperationsDate(newOps, account);
    // preserve initial date, initial date is from the "operation3" of "account". So result is updated from newOps
    expect(result.find(op => op.hash === "hash2")?.date).toEqual(new Date("2023-04-01"));
  });
  it("no need to update operations date in newOps as newOps contains different operations hash than those in existing account", () => {
    const account = fromAccountRaw({
      ...ethereum2,
      blockHeight: 10042069,
      syncHash: "NotImportant",
      operations: [operation4],
      operationsCount: 1,
    });
    const result = preserveInitialOperationsDate(newOps, account);
    // no need to update date in newOps because operation4 has a different hash. So result is same as newOps
    expect(result[0].date).toEqual(new Date("2023-04-01")); // operation1 date
    expect(result[1].date).toEqual(new Date("2023-04-02")); // operation2 date
  });
});
