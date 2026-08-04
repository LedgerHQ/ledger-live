import network from "@ledgerhq/live-network";
import { getBlock } from "./getBlock";

jest.mock("@ledgerhq/live-network", () => jest.fn());

describe("getBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns the parsed block on a successful response", async () => {
    const block = { id: "0xabc", number: 42, timestamp: 1_700_000_000, transactions: [] };
    jest.mocked(network).mockResolvedValueOnce({ data: block, status: 200 });

    const result = await getBlock(42);

    expect(result).toEqual(block);
  });

  it("requests expanded=false by default", async () => {
    jest.mocked(network).mockResolvedValueOnce({ data: null, status: 200 });

    await getBlock(42);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({
        method: "GET",
        url: expect.stringContaining("/blocks/42?expanded=false"),
      }),
    );
  });

  it("requests expanded=true when asked", async () => {
    jest.mocked(network).mockResolvedValueOnce({ data: null, status: 200 });

    await getBlock(42, true);

    expect(network).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining("expanded=true") }),
    );
  });

  it("rejects a negative revision without making a network call", async () => {
    await expect(getBlock(-1)).rejects.toThrow("vechain: getBlock: invalid revision -1");
    expect(network).not.toHaveBeenCalled();
  });

  it("rejects a non-integer revision without making a network call", async () => {
    await expect(getBlock(1.5)).rejects.toThrow("vechain: getBlock: invalid revision 1.5");
    expect(network).not.toHaveBeenCalled();
  });

  it("propagates a network error", async () => {
    jest.mocked(network).mockRejectedValueOnce(new Error("status 500"));

    await expect(getBlock(42)).rejects.toThrow("status 500");
  });
});
