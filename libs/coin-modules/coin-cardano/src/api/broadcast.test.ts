import type { Context } from "@ledgerhq/coin-module-framework/config";
import type { CardanoCoinConfig } from "../config";
import { cardanoCoinConfig } from "../fixtures/config";
import { broadcast } from "../logic/broadcast";
import { createApi } from ".";

jest.mock("../logic/broadcast", () => ({
  broadcast: jest.fn(),
}));

const mockBroadcast = jest.mocked(broadcast);

const config = cardanoCoinConfig;
const mockCtx: Context<CardanoCoinConfig> = {
  config: async () => config,
  logger: () => {},
};

describe("api.broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the broadcast logic with the resolved config and signature", async () => {
    mockBroadcast.mockResolvedValue("txHash");
    const api = createApi("cardano");

    const result = await api.broadcast(mockCtx, "signedTxPayload");

    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast).toHaveBeenCalledWith(config, {
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

    expect(mockBroadcast).toHaveBeenCalledWith(config, {
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
