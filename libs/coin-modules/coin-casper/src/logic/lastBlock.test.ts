import { createMockContext } from "../__tests__/fixtures/config.fixture";
import { fetchLastBlock } from "../network/api";
import { lastBlock } from "./lastBlock";

jest.mock("../network/api", () => ({
  fetchLastBlock: jest.fn(),
}));

const context = createMockContext();

describe("lastBlock", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns BlockInfo from fetchLastBlock", async () => {
    const mockData = {
      height: 1234567,
      hash: "0xabc123def456",
      time: new Date("2024-06-01T12:00:00Z"),
    };
    (fetchLastBlock as jest.Mock).mockResolvedValue(mockData);

    const result = await lastBlock(context);

    expect(fetchLastBlock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockData);
  });

  it("propagates errors from the network layer", async () => {
    (fetchLastBlock as jest.Mock).mockRejectedValue(new Error("network failure"));

    await expect(lastBlock(context)).rejects.toThrow("network failure");
  });
});
