import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Canton from "../src/Canton";

describe("Canton", () => {
  describe("decorateAppAPIMethods", () => {
    it("should properly decorate transport methods", async () => {
      const transport = await openTransportReplayer(new RecordStore());
      const canton = new Canton(transport);

      expect(canton.transport).toBeDefined();
      expect(typeof canton.getAddress).toBe("function");
      expect(typeof canton.signTransaction).toBe("function");
      expect(typeof canton.getAppConfiguration).toBe("function");
    });
  });

  describe("getAddress", () => {
    it("should get address without display", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005000015058000002c80001a6f800000008000000080000000
          <= 4d65a10662b9759d62bb59048366705454654cf4f9b4b3525cf314429e46c6919000
        `),
      );

      const canton = new Canton(transport);
      const result = await canton.getAddress("44'/6767'/0'/0'/0'");

      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.publicKey).toBeDefined();
    });

    it("should get address with display", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005010015058000002c80001a6f800000008000000080000000
          <= 4d65a10662b9759d62bb59048366705454654cf4f9b4b3525cf314429e46c6919000
        `),
      );

      const canton = new Canton(transport);
      const result = await canton.getAddress("44'/6767'/0'/0'/0'", true);

      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.publicKey).toBeDefined();
    });

    it("should throw on invalid derivation path", async () => {
      const transport = await openTransportReplayer(new RecordStore());
      const canton = new Canton(transport);

      return expect(canton.getAddress("invalid path")).rejects.toThrow();
    });

    it("should handle various derivation paths", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005000015058000002c80001a6f800000008000000080000001
          <= 5e66a10773c0860e73bb6015947806555765df5f9b5b4636df4255a57c57d7029000
        `),
      );

      const canton = new Canton(transport);
      const result = await canton.getAddress("44'/6767'/0'/0'/1'");

      expect(result).toBeDefined();
      expect(result.address).toBeDefined();
      expect(result.publicKey).toBeDefined();
    });

    // should handle user refused address
  });

  describe("signTransaction", () => {
    // should sign transaction

    // should handle large transaction payloads

    // should handle empty transaction

    // should request blind signature when required

    it("should handle user refused transaction", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e006010015058000002c80001a6f800000008000000080000000
          <= 6985
        `),
      );

      const canton = new Canton(transport);

      return expect(canton.signTransaction("44'/6767'/0'/0'/0'", "test")).rejects.toThrow();
    });
  });

  describe("getAppConfiguration", () => {
    it("should get app configuration", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e003000000
          <= 0202029000
        `),
      );

      const canton = new Canton(transport);
      const result = await canton.getAppConfiguration();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("version");
      expect(typeof result.version).toBe("string");
    });

    // should handle configuration error
  });
});
