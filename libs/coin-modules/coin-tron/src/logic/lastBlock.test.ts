import type { TronCoinConfig } from "../config";
import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getLastBlock } from "../network";
import { lastBlock } from "./lastBlock";

jest.mock("../network");

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

describe("lastBlock", () => {
  it("should return the last block info", async () => {
    const mockBlockInfo: BlockInfo = {
      hash: "0000000000000000000a8edc8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8f8b8",
      height: 123456,
      time: new Date(1617181723),
    };

    (getLastBlock as jest.Mock).mockResolvedValue(mockBlockInfo);

    const result = await lastBlock(mockConfig);

    expect(result).toEqual(mockBlockInfo);
    expect(getLastBlock).toHaveBeenCalledTimes(1);
  });
});
