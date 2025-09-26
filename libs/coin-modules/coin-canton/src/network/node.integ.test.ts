import coinConfig from "../config";
import { getLedgerEnd } from "./node";

// enable manually, as it requires a running node locally
describe.skip("Node (localnet)", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      gatewayUrl: "http://gateway.url",
      nodeUrl: "http://localhost:2975/v2",
      nativeInstrumentId: "Amulet",
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

// enable manually, as it requires an auth token in env variable
describe.skip("Node (devnet)", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      nodeUrl: "https://wallet-validator-devnet-canton.ledger-test.com/v2",
      networkType: "devnet",
      nativeInstrumentId: "Amulet",
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
