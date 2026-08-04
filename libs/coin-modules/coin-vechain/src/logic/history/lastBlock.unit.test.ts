import { getLastBlockHeight } from "../../network";
import { getBlockInfo } from "./getBlockInfo";
import { lastBlock } from "./lastBlock";

jest.mock("../../network", () => ({ getLastBlockHeight: jest.fn() }));
jest.mock("./getBlockInfo", () => ({ getBlockInfo: jest.fn() }));

describe("lastBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("resolves the current height then delegates to getBlockInfo", async () => {
    jest.mocked(getLastBlockHeight).mockResolvedValueOnce(123);
    const info = { height: 123, hash: "0xabc", time: new Date() };
    jest.mocked(getBlockInfo).mockResolvedValueOnce(info);

    const result = await lastBlock();

    expect(getBlockInfo).toHaveBeenCalledWith(123);
    expect(result).toBe(info);
  });

  it("propagates an error from the height lookup", async () => {
    jest.mocked(getLastBlockHeight).mockRejectedValueOnce(new Error("network down"));

    await expect(lastBlock()).rejects.toThrow("network down");
    expect(getBlockInfo).not.toHaveBeenCalled();
  });
});
