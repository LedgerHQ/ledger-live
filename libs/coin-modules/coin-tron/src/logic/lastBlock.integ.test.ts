import type { TronCoinConfig } from "../config";
import { lastBlock } from "./lastBlock";

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

describe("lastBlock", () => {
  it("returns last block info", async () => {
    // When
    const result = await lastBlock(mockConfig);

    // Then
    expect(result.hash?.length).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
