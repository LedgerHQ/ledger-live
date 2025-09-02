import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Canton from "./Canton";

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
      const result = await canton.getAddress("44'/6767'/0'");

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
      const result = await canton.getAddress("44'/6767'/0'", true);

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

    it("should sign transaction hash", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e006000315058000002c80001a6f800000008000000080000000
          <= 9000
          => e006000020d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd
          <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00009000
        `),
      );

      const canton = new Canton(transport);
      const txHash = "d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd";

      const result = await canton.signTransaction("44'/6767'/0'", txHash);

      expect(result).toEqual(
        "40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a0000",
      );
    });

    it("should handle user refused transaction", async () => {
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e006010015058000002c80001a6f800000008000000080000000
          <= 6985
        `),
      );

      const canton = new Canton(transport);

      return expect(canton.signTransaction("44'/6767'/0'", "test")).rejects.toThrow();
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
