import { getAlpacaApi } from "./alpaca";
import { genericBroadcast } from "./broadcast";

jest.mock("./alpaca", () => ({
  getAlpacaApi: jest.fn(),
}));

describe("genericBroadcast", () => {
  it("propagates errors from Alpaca", async () => {
    (getAlpacaApi as jest.Mock).mockResolvedValue({
      broadcast: jest.fn().mockRejectedValue(new Error("Broadcast Error")),
    });

    const broadcast = genericBroadcast("network", "local");

    await expect(
      broadcast({
        signedOperation: { signature: "", operation: {} },
        account: { currency: { id: "network" } },
      } as any),
    ).rejects.toThrow("Broadcast Error");
  });
});
