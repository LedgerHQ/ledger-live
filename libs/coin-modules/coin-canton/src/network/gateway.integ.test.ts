import coinConfig from "../config";
import { getLedgerEnd, prepareOnboarding } from "./gateway";

describe("gateway (devnet)", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "https://canton-gateway.api.live.ledger-test.com",
      useGateway: true,
      networkType: "devnet",
      status: {
        type: "active",
      },
    }));
  });
  describe("prepareOnboarding", () => {
    it("should prepare onboarding", async () => {
      const response = await prepareOnboarding(
        "0x043b462de34ec31fba274f2a381947aef26697912194312fc289c46cc1b2b4f6b00828dc1e4f96001b10463083edf85f2e0550862a3dc99ed411ca6d25f2bc19a8",
        "ed25519",
      );
      expect(response).toHaveProperty("party_id");
      expect(response).toHaveProperty("party_name");
      expect(response).toHaveProperty("public_key_fingerprint");
      expect(response).toHaveProperty("topology_transactions_hash");
    });
  });
  describe("getLedgerEnd", () => {
    it("should return ledger end", async () => {
      const end = await getLedgerEnd();
      expect(end).toBeGreaterThanOrEqual(0);
    });
  });
});
