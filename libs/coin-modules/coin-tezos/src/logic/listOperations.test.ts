import { listOperations } from "./listOperations";
import type { APIDelegationType, APIRevealType, APITransactionType } from "../network/types";

const mockNetworkGetTransactions = jest.fn();
jest.mock("../network", () => ({
  tzkt: {
    getAccountOperations: async () => {
      return mockNetworkGetTransactions();
    },
  },
}));

const options: { sort: "Ascending" | "Descending"; minHeight: number } = {
  sort: "Ascending",
  minHeight: 0,
};

describe("listOperations", () => {
  afterEach(() => {
    mockNetworkGetTransactions.mockClear();
  });

  it("should return no operations", async () => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue([]);
    // When
    const [results, token] = await listOperations("any address", options);
    // Then
    expect(results).toEqual([]);
    expect(token).toEqual("");
  });

  const someDestinationAddress = "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D";
  const someSenderAddress = "tz2CVMDVA16dD9A7kpWym2ptGDhs5zUhwWXr";
  const someHash = "ooY7YKLgWE8mrELbsDLEtPsxFNaLdqRbbRR1b1FXDA6DwasAFe4";
  const commonTx = {
    counter: 65214462,
    hash: someHash,
    gasLimit: 4,
    storageLimit: 5,
    level: 2702551,
    block: "BMJ1ZQ6",
    timestamp: "2022-09-12T01:36:59Z",
    sender: {
      address: someSenderAddress,
    },
  };
  const delegate: APIDelegationType = {
    ...commonTx,
    type: "delegation",
    id: 111,
    amount: 724846,
    prevDelegate: {
      address: someDestinationAddress,
    },
    newDelegate: null,
    storageFee: 1,
    bakerFee: 2,
    allocationFee: 3,
  };

  const undelegate: APIDelegationType = {
    ...delegate,
    id: 222,
    prevDelegate: null,
    newDelegate: { address: someDestinationAddress },
  };

  const transfer: APITransactionType = {
    ...delegate,
    id: 333,
    initiator: null,
    type: "transaction",
    target: { address: someDestinationAddress },
  };

  const reveal: APIRevealType = {
    ...commonTx,
    id: 444,
    type: "reveal",
    bakerFee: 4700,
    status: "applied",
  };

  it.each([
    ["undelegate", undelegate],
    ["delegate", delegate],
    ["transfer", transfer],
  ])("should return %s operation with proper recipient list", async (_label, operation) => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue([operation]);
    // When
    const [results] = await listOperations("any address", options);
    // Then
    expect(results).toEqual([
      {
        id: `${operation.hash}-${operation.id}`,
        asset: { type: "native" },
        details: {
          counter: operation.counter,
          gasLimit: operation.gasLimit,
          storageLimit: operation.storageLimit,
        },
        senders: [someSenderAddress],
        recipients: [someDestinationAddress],
        tx: {
          block: {
            hash: operation.block,
            height: operation.level,
            time: new Date(operation.timestamp),
          },
          date: new Date(operation.timestamp),
          hash: operation.hash,
          fees: BigInt(
            (operation.allocationFee ?? 0) +
              (operation.bakerFee ?? 0) +
              (operation.storageFee ?? 0),
          ),
        },
        type: operation.type,
        value: BigInt(operation.amount),
      },
    ]);
  });

  it.each([
    ["undelegate", undelegate],
    ["delegate", delegate],
    ["transfer", transfer],
    ["reveal", reveal],
  ])(
    "should return %s operation with pagination equal to operation id",
    async (_label, operation) => {
      // Given
      mockNetworkGetTransactions.mockResolvedValue([operation]);
      // When
      const [results, token] = await listOperations("any address", options);
      // Then
      expect(results.length).toEqual(1);
      expect(token).toEqual(JSON.stringify(operation.id));
    },
  );

  it.each([
    ["undelegate", undelegate],
    ["delegate", delegate],
    ["transfer", transfer],
    ["reveal", reveal],
  ])("should return %s operation with expected details", async (_label, operation) => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue([operation]);
    // When
    const [results, _] = await listOperations("any address", options);
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].details).toEqual({
      counter: 65214462,
      gasLimit: 4,
      storageLimit: 5,
    });
  });

  it.each([
    { ...undelegate, newDelegate: null, prevDelegate: null },
    { ...transfer, target: null },
  ])("should return empty recipient list when no target can be found", async operation => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue([operation]);
    // When
    const [results, token] = await listOperations("any address", options);
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].recipients).toEqual([]);
    expect(token).toEqual(JSON.stringify(operation.id));
  });

  it.each([
    ["undelegate", { ...undelegate, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
    ["delegate", { ...delegate, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
    ["transfer", { ...transfer, storageFee: 1, bakerFee: 2, allocationFee: 3 }],
  ])("should compute the fees properly for %s operation", async (_label, operation) => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue([operation]);
    // When
    const [results, _] = await listOperations("any address", options);
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].tx.fees).toEqual(BigInt(6));
  });

  it("should return empty sender list when no sender can be found", async () => {
    // Given
    const operation = { ...undelegate, sender: null };
    mockNetworkGetTransactions.mockResolvedValue([operation]);
    // When
    const [results, token] = await listOperations("any address", options);
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].senders).toEqual([]);
    expect(token).toEqual(JSON.stringify(operation.id));
  });

  it("should order the results in descending order even if the sort option is set to ascending", async () => {
    const op1 = { ...undelegate, level: "1" };
    const op2 = { ...undelegate, level: "2" };
    mockNetworkGetTransactions.mockResolvedValue([op1, op2]);
    const [results, _] = await listOperations("any address", options);
    expect(results.map(op => op.tx.block.height)).toEqual(["2", "1"]);
  });
});
