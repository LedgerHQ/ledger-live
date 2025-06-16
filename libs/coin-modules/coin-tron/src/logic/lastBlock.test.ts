import { lastBlock } from "./lastBlock";
import { getLastBlock } from "../network";
import type { BlockInfo } from "@ledgerhq/coin-framework/api/index";

jest.mock("../network");

describe("lastBlock", () => {
  it("should return the last block info", async () => {
    const mockBlockInfo: BlockInfo = {
      hash: "0000000000000000000a8edc8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8",
      height: 123456,
      time: new Date(1617181723),
    };

    (getLastBlock as jest.Mock).mockResolvedValue(mockBlockInfo);

    const result = await lastBlock();

    expect(result).toEqual(mockBlockInfo);
    expect(getLastBlock).toHaveBeenCalledTimes(1);
  });
});
