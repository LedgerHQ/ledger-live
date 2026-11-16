import type { Logger } from "@ledgerhq/coin-module-framework/config";
import { tronDefaults, type TronCoinConfig } from "../config";
import { lastBlock } from "./lastBlock";

const mockLogger: Logger = jest.fn();

const mockConfig = tronDefaults.tron as TronCoinConfig;

describe("lastBlock", () => {
  it("returns last block info", async () => {
    // When
    const result = await lastBlock(mockLogger, mockConfig);

    // Then
    expect(result.hash?.length).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
    expect(result.time).toBeInstanceOf(Date);
  });
});
