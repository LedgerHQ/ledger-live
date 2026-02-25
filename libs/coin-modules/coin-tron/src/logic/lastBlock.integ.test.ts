import coinConfig from "../config";
import { lastBlock } from "./lastBlock";

describe("lastBlock", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: {
        type: "active",
      },
      explorer: {
        url: "https://tron.coin.ledger.com",
      },
    }));
  });
  it("returns last block info", async () => {
    // When
    const result = await lastBlock();

    // Then
    expect(result.hash?.length).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
