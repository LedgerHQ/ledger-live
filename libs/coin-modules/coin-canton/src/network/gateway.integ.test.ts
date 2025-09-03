import coinConfig from "../config";
import {
  getLedgerEnd,
  prepareOnboarding,
  getBalance,
  getTransactions,
  getPartyById,
  getPartyByPubKey,
} from "./gateway";

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
        "c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c51097",
        "ed25519",
      );
      expect(response).toHaveProperty("party_id");
      expect(response).toHaveProperty("party_name");
      expect(response).toHaveProperty("public_key_fingerprint");
      expect(response).toHaveProperty("topology_transactions_hash");
    }, 30000);
  });

  describe("getLedgerEnd", () => {
    it("should return ledger end", async () => {
      const end = await getLedgerEnd();
      expect(end).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getBalance", () => {
    it("should return user balance", async () => {
      const balance = await getBalance(
        "party-4f2e1485107adf5f::122027c6dbbbdbffe0fa3122ae05175f3b9328e879e9ce96b670354deb64a45683c1",
      );
      expect(balance.length).toBeGreaterThanOrEqual(1);
      expect(balance[0].amount).toBeGreaterThanOrEqual(0);
      expect(balance[0].instrument_id.includes("Splice")).toBe(true);
    });
  });

  describe("getPartyById", () => {
    it.skip("should return party info", async () => {
      const party = await getPartyById("4f2e1485107adf5f");
      expect(party).toBeDefined();
    });
  });

  describe("getPartyByPubKey", () => {
    it.skip("should return party info", async () => {
      const party = await getPartyByPubKey(
        "122027c6dbbbdbffe0fa3122ae05175f3b9328e879e9ce96b670354deb64a45683c1",
      );
      expect(party).toBeDefined();
    });
  });

  describe("getTransactions", () => {
    it("should return user transactions", async () => {
      const { transactions } = await getTransactions(
        "party-5f29bb32e9939939::12202becd8062a1d170209956cfd977fca76fcb4d2a892d08c77a7483f35a11d6440",
      );
      expect(transactions.length).toBeGreaterThanOrEqual(0);
    });
  });
});
