import { SYNTHETIC_BLOCK_WINDOW_SECONDS } from "../constants";
import { getBlockInfo } from "./getBlockInfo";

describe("getBlockInfo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should calculate time correctly based on block height and default window", async () => {
    const blockHeight = 100;
    const expectedSeconds = blockHeight * SYNTHETIC_BLOCK_WINDOW_SECONDS;
    const expectedTime = new Date(expectedSeconds * 1000);

    const result = await getBlockInfo(blockHeight);

    expect(result).toMatchObject({
      height: blockHeight,
      hash: expect.any(String),
      time: expectedTime,
    });
  });

  it("should use custom block window seconds when provided", async () => {
    const blockHeight = 50;
    const customWindow = 120;
    const expectedSeconds = blockHeight * customWindow;
    const expectedTime = new Date(expectedSeconds * 1000);

    const result = await getBlockInfo(blockHeight, customWindow);

    expect(result).toMatchObject({
      height: blockHeight,
      hash: expect.any(String),
      time: expectedTime,
    });
  });
});
