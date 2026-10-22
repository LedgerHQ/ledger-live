import type { BitcoinContext } from "../../config";
import { broadcast } from "../broadcast";
import { SPENT_TX, buildSignedTxHex } from "./helpers/fixtures";

// Nothing real is ever broadcast here: every transaction is one the node rejects.
const liveContext: BitcoinContext = {
  config: async () => ({
    status: { type: "active" },
    name: "Bitcoin",
    unit: { name: "bitcoin", code: "BTC", magnitude: 8 },
    explorer: { url: "https://explorers.api.live.ledger.com" },
    explorerId: "btc",
  }),
  logger: () => {},
};

// The assertions check the node's own rejection, so an outage or a client-side error cannot pass for
// one.
describe("broadcast (live explorer)", () => {
  it("throws the node's rejection of a transaction spending an already spent output", async () => {
    const { txHex } = buildSignedTxHex([{ prevTxid: SPENT_TX, index: 0 }]);
    await expect(broadcast(liveContext, "bitcoin", txHex)).rejects.toMatchObject({
      name: "LedgerAPI4xx",
      message: expect.stringContaining("bad-txns-inputs-missingorspent"),
    });
  });

  it("throws the node's rejection of a transaction spending an unknown output", async () => {
    await expect(broadcast(liveContext, "bitcoin", buildSignedTxHex().txHex)).rejects.toMatchObject(
      { name: "LedgerAPI4xx", message: expect.stringContaining("bad-txns-inputs-missingorspent") },
    );
  });

  it("throws the node's rejection of garbage", async () => {
    await expect(broadcast(liveContext, "bitcoin", "deadbeef")).rejects.toMatchObject({
      name: "LedgerAPI4xx",
      message: expect.stringContaining("TX decode failed"),
    });
  });
});
