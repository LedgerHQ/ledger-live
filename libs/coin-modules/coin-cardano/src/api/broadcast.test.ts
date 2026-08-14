import type { Context } from "@ledgerhq/coin-module-framework/config";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { CardanoCoinConfig, CardanoConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { createApi } from ".";

jest.mock("../logic/broadcast", () => ({
  broadcast: jest.fn(),
}));

const mockBroadcast = jest.mocked(broadcast);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const currency = getCryptoCurrencyById("cardano");
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => ({ ...config, status: { type: "active" } }),
  logger: () => {},
};

describe("api.broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the broadcast logic with the resolved currency and signature", async () => {
    mockBroadcast.mockResolvedValue("txHash");
    const api = createApi("cardano");

    const result = await api.broadcast(mockCtx, "signedTxPayload");

    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast).toHaveBeenCalledWith(currency, {
      signature: "signedTxPayload",
      broadcastConfig: undefined,
    });
    expect(result).toBe("txHash");
  });

  it("forwards the broadcastConfig to the broadcast logic", async () => {
    mockBroadcast.mockResolvedValue("txHash");
    const api = createApi("cardano");
    const broadcastConfig = { mevProtected: true };

    await api.broadcast(mockCtx, "signedTxPayload", { broadcastConfig });

    expect(mockBroadcast).toHaveBeenCalledWith(currency, {
      signature: "signedTxPayload",
      broadcastConfig,
    });
  });

  it("propagates errors thrown by the broadcast logic", async () => {
    mockBroadcast.mockRejectedValue(new Error("tx submission failed"));

    const api = createApi("cardano");

    await expect(api.broadcast(mockCtx, "signedTxPayload")).rejects.toThrow("tx submission failed");
  });
});
