import { getVirtualChainBlueScore } from "../index";

describe("getVirtualChainBlueScore", () => {
  beforeEach(() => {
    // Clear all mocks before each test to avoid interference
    jest.clearAllMocks();
  });

  it("should return the blue score from the API response", async () => {
    // Mock the global fetch function
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ blueScore: 12345 }),
    });

    const result = await getVirtualChainBlueScore();
    expect(result).toBe(12345);
  });

  it("should throw an error when the fetch fails", async () => {
    // Mock a failed fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
    });

    await expect(getVirtualChainBlueScore()).rejects.toThrow("Failed to fetch");
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
