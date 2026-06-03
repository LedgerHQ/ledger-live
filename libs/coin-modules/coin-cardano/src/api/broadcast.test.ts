import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import type { CardanoConfig } from "../config";
import { broadcast } from "../logic/broadcast";
import { createApi } from ".";

jest.mock("../logic/broadcast", () => ({
  broadcast: jest.fn(),
}));

const mockBroadcast = jest.mocked(broadcast);

const config: CardanoConfig = { maxFeesWarning: 0, maxFeesError: 0 };
const currency = getCryptoCurrencyById("cardano");

describe("api.broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("delegates to the broadcast logic with the resolved currency and signature", async () => {
    mockBroadcast.mockResolvedValue("txHash");
    const api = createApi(config, "cardano");

    const result = await api.broadcast("signedTxPayload");

    expect(mockBroadcast).toHaveBeenCalledTimes(1);
    expect(mockBroadcast).toHaveBeenCalledWith(currency, {
      signature: "signedTxPayload",
      broadcastConfig: undefined,
    });
    expect(result).toBe("txHash");
  });

  it("forwards the broadcastConfig to the broadcast logic", async () => {
    mockBroadcast.mockResolvedValue("txHash");
    const api = createApi(config, "cardano");
    const broadcastConfig = { mevProtected: true };

    await api.broadcast("signedTxPayload", broadcastConfig);

    expect(mockBroadcast).toHaveBeenCalledWith(currency, {
      signature: "signedTxPayload",
      broadcastConfig,
    });
  });

  it("propagates errors thrown by the broadcast logic", async () => {
    mockBroadcast.mockRejectedValue(new Error("tx submission failed"));

    const api = createApi(config, "cardano");

    await expect(api.broadcast("signedTxPayload")).rejects.toThrow("tx submission failed");
  });
});
