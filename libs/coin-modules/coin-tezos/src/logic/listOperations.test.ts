import { listOperations } from "./listOperations";
import { APIDelegationType, APITransactionType } from "../network/types";

const mockNetworkGetTransactions = jest.fn();
jest.mock("../network", () => ({
  tzkt: {
    getAccountOperations: async () => {
      return mockNetworkGetTransactions();
    },
  },
}));

describe("listOperations", () => {
  afterEach(() => {
    mockNetworkGetTransactions.mockClear();
  });

  it("should return no operations", async () => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue([]);
    // When
    const [results, token] = await listOperations("any address", {});
    // Then
    expect(results).toEqual([]);
    expect(token).toEqual("");
  });

  const someDestinationAddress = "tz3Vq38qYD3GEbWcXHMLt5PaASZrkDtEiA8D";
  const someSenderAddress = "tz2CVMDVA16dD9A7kpWym2ptGDhs5zUhwWXr";
  const delegate: APIDelegationType = {
    type: "delegation",
    id: 111,
    level: 2702551,
    block: "BMJ1ZQ6",
    timestamp: "2022-09-12T01:36:59Z",
    amount: 724846,
    sender: {
      address: someSenderAddress,
    },
    counter: 65214462,
    prevDelegate: {
      address: someDestinationAddress,
    },
    newDelegate: null,
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

  it.each([undelegate, delegate, transfer])(
    "should return operation with proper recipient list",
    async operation => {
      // Given
      mockNetworkGetTransactions.mockResolvedValue([operation]);
      // When
      const [results, token] = await listOperations("any address", {});
      // Then
      expect(results.length).toEqual(1);
      expect(results[0].recipients).toEqual([someDestinationAddress]);
      expect(token).toEqual(JSON.stringify(operation.id));
    },
  );

  it.each([
    { ...undelegate, newDelegate: null, prevDelegate: null },
    { ...transfer, target: null },
  ])("should return empty recipient list when no target can be found", async operation => {
    // Given
    mockNetworkGetTransactions.mockResolvedValue([operation]);
    // When
    const [results, token] = await listOperations("any address", {});
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].recipients).toEqual([]);
    expect(token).toEqual(JSON.stringify(operation.id));
  });

  it("should return empty sender list when no sender can be found", async () => {
    // Given
    const operation = { ...undelegate, sender: null };
    mockNetworkGetTransactions.mockResolvedValue([operation]);
    // When
    const [results, token] = await listOperations("any address", {});
    // Then
    expect(results.length).toEqual(1);
    expect(results[0].senders).toEqual([]);
    expect(token).toEqual(JSON.stringify(operation.id));
  });
});
