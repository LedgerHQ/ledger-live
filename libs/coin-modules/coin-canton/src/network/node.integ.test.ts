import coinConfig from "../config";
import { getLedgerEnd } from "./node";

describe("Node (localnet)", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "http://gateway.url",
      nodeUrl: "http://localhost:2975/v2",
      networkType: "localnet",
      status: { type: "active" },
    }));
  });

  describe("getLedgerEnd", () => {
    it("should return ledger end", async () => {
      const end = await getLedgerEnd();
      expect(end).toBeGreaterThan(0);
    });
  });
});

describe("Node (devnet)", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      nodeUrl: "https://wallet-validator-devnet-canton.ledger-test.com/v2",
      networkType: "devnet",
      status: { type: "active" },
      gatewayUrl: "http://gateway.url",
    }));
  });

  describe("getLedgerEnd", () => {
    it("should return ledger end", async () => {
      const end = await getLedgerEnd();
      expect(end).toBeGreaterThan(0);
    });
  });
});
