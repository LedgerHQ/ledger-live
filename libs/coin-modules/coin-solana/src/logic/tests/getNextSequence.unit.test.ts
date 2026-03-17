/* eslint-disable @typescript-eslint/consistent-type-assertions */
import type { ChainAPI } from "../../network";
import { getNextSequence } from "../getNextSequence";

describe("getNextSequence", () => {
  const mockGetSlot = jest.fn();

  const api = {
    connection: { getSlot: mockGetSlot },
  } as unknown as ChainAPI;

  afterEach(() => jest.clearAllMocks());

  it("should return the current slot as bigint", async () => {
    mockGetSlot.mockResolvedValue(350_000_000);

    const result = await getNextSequence(api, "someAddress");

    expect(result).toBe(350_000_000n);
    expect(mockGetSlot).toHaveBeenCalled();
  });

  it("should handle slot 0", async () => {
    mockGetSlot.mockResolvedValue(0);

    const result = await getNextSequence(api, "someAddress");

    expect(result).toBe(0n);
  });

  it("should propagate RPC errors", async () => {
    mockGetSlot.mockRejectedValue(new Error("RPC error"));

    await expect(getNextSequence(api, "someAddress")).rejects.toThrow("RPC error");
  });
});
