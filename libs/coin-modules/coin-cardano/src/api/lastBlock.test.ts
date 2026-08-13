import type { Context } from "@ledgerhq/coin-module-framework/config";
import { createApi } from ".";
import { type CardanoCoinConfig, type CardanoConfig } from "../config";
import { lastBlock } from "../logic/lastBlock";

jest.mock("../logic/lastBlock");
const mockLastBlock = jest.mocked(lastBlock);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("lastBlock", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to logic lastBlock with the resolved currency", async () => {
    const blockInfo = { height: 42, hash: "", time: new Date() };
    mockLastBlock.mockResolvedValue(blockInfo);

    const api = createApi("cardano");
    const result = await api.lastBlock(mockCtx);

    expect(result).toBe(blockInfo);
    expect(mockLastBlock).toHaveBeenCalledTimes(1);
    expect(mockLastBlock.mock.calls[0][0].id).toBe("cardano");
  });

  it("propagates errors from logic lastBlock", async () => {
    mockLastBlock.mockRejectedValue(new Error("boom"));

    const api = createApi("cardano");

    await expect(api.lastBlock(mockCtx)).rejects.toThrow("boom");
  });
});
