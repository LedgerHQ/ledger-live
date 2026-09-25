import { broadcast } from "../broadcast";
import * as network from "../../network";
import type { BitcoinContext } from "../../api/config";

jest.mock("../../network");

const mockedBroadcastTx = network.broadcastTx as jest.MockedFunction<typeof network.broadcastTx>;

// Minimal stub context: only `config()` is exercised by the logic under test.
const context = {
  config: async () => ({ status: { type: "active" } }),
} as unknown as BitcoinContext;

describe("logic/broadcast", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns the transaction id reported by the explorer", async () => {
    mockedBroadcastTx.mockResolvedValue("deadbeefcafe");
    const result = await broadcast(context, "bitcoin", "rawtxhex");
    expect(result).toBe("deadbeefcafe");
  });

  it("throws when the explorer returns an empty transaction id", async () => {
    mockedBroadcastTx.mockResolvedValue("");
    await expect(broadcast(context, "bitcoin", "rawtxhex")).rejects.toThrow(/empty transaction id/);
  });
});
