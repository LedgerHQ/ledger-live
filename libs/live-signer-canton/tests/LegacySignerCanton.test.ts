/**
import { LegacySignerCanton } from "../src/LegacySignerCanton";
import Transport from "@ledgerhq/hw-transport";

const signer = new LegacySignerCanton({ decorateAppAPIMethods: () => {} } as unknown as Transport);

describe("LegacySignerCanton", () => {
  describe("getAppConfiguration", () => {
    it("should return app configuration", async () => {
      const result = await signer.getAppConfiguration();

      expect(result).toBeDefined();
      expect(result.version).toBe("0.1.0");
    });
  });

  describe("getAddress", () => {
    it("should return an address for a given path", async () => {
      const path = "44'/6767'/0'/0'/0'";
      const result = await signer.getAddress(path);

      expect(result).toBeDefined();
      expect(result.publicKey).toMatch(/^0x[a-fA-F0-9]{130}$/);
      expect(result.address).toMatch(/^canton_[a-zA-Z0-9]+$/);
    });
  });

  describe("signTransaction", () => {
    it("should return a signature for a transaction", async () => {
      const path = "44'/6767'/0'/0'/0'";
      const rawTx = "0x1234567890abcdef";

      const result = await signer.signTransaction(path, rawTx);

      expect(result).toBeDefined();
      expect(result).toMatch(/^0x[a-fA-F0-9]{128}$/);
    });
  });
});
 */

describe("LegacySignerCanton", () => {
  it("needs to be implemented", () => {
    expect(true).toBeDefined();
  });
});
