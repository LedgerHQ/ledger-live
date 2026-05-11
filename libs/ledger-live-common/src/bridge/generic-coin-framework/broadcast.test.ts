import { getCoinModuleApi } from "./api";
import { genericBroadcast } from "./broadcast";

jest.mock("./api", () => ({
  getCoinModuleApi: jest.fn(),
}));

describe("genericBroadcast", () => {
  it("propagates errors from coin-framework", async () => {
    (getCoinModuleApi as jest.Mock).mockResolvedValue({
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
