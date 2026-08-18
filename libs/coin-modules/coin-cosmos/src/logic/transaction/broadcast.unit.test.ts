import { CosmosAPI } from "../../network/Cosmos";
import { broadcast } from "./broadcast";

describe("logic/transaction/broadcast", () => {
  it("returns the transaction hash from the network", async () => {
    const api = {
      broadcastRawTransaction: jest.fn().mockResolvedValue("ABC123HASH"),
    } as unknown as CosmosAPI;

    const hash = await broadcast(api, "deadbeef");

    expect(api.broadcastRawTransaction).toHaveBeenCalledWith("deadbeef");
    expect(hash).toBe("ABC123HASH");
  });

  it("propagates broadcast errors (never swallowed)", async () => {
    const api = {
      broadcastRawTransaction: jest.fn().mockRejectedValue(new Error("invalid broadcast return")),
    } as unknown as CosmosAPI;

    await expect(broadcast(api, "deadbeef")).rejects.toThrow("invalid broadcast return");
  });
});
