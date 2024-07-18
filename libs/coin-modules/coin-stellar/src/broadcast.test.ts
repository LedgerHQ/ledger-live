import { broadcast } from "./broadcast";
import { createFixtureAccount, createFixtureOperation } from "./types/bridge.fixture";

const mockBroadcast = jest.fn();
jest.mock("./network", () => ({
  broadcastTransaction: (sig: unknown) => mockBroadcast(sig),
}));

describe("broadcast", () => {
  beforeEach(() => mockBroadcast.mockClear());

  it("calls network apiNetwork", async () => {
    // When
    await broadcast({
      account: createFixtureAccount(),
      signedOperation: {
        signature: "Whatever signature",
        operation: createFixtureOperation(),
      },
    });

    // Then
    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast.mock?.lastCall[0]).toEqual("Whatever signature");
  });

  it("returns a new operation with 'hash' setted and new id", async () => {
    // Given
    const operation = createFixtureOperation();
    mockBroadcast.mockResolvedValue("Any hash value");

    // When
    const newOperation = await broadcast({
      account: createFixtureAccount(),
      signedOperation: {
        signature: "Whatever signature",
        operation,
      },
    });

    // Then
    expect(newOperation).toEqual({
      ...operation,
      id: expect.any(String),
      hash: "Any hash value",
      nftOperations: [],
      subOperations: [],
    });
    expect(newOperation.id).not.toEqual(operation.id);
  });
});
