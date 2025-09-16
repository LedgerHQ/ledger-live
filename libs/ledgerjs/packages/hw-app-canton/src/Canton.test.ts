import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Canton from "./Canton";

describe("Canton", () => {
  describe("decorateAppAPIMethods", () => {
    it("should properly decorate transport methods", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());

      // WHEN
      const canton = new Canton(transport);

      // THEN
      expect(canton.transport).toBeDefined();
      expect(typeof canton.getAddress).toBe("function");
      expect(typeof canton.signTransaction).toBe("function");
      expect(typeof canton.getAppConfiguration).toBe("function");
    });
  });

  describe("getAddress", () => {
    it("should get address without display", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005000015058000002c80001a6f800000008000000080000000
          <= 20c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c5109720c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c510979000
        `),
      );
      const canton = new Canton(transport);

      // WHEN
      const result = await canton.getAddress("44'/6767'/0'/0'/0'");

      // THEN
      expect(result).toEqual({
        address: "402f2e68",
        path: "44'/6767'/0'/0'/0'",
        publicKey: "c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c51097",
      });
    });

    it("should get address with display", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005010015058000002c80001a6f800000008000000080000000
          <= 20c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c5109720c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c510979000
        `),
      );
      const canton = new Canton(transport);

      // WHEN
      const result = await canton.getAddress("44'/6767'/0'/0'/0'", true);

      // THEN
      expect(result).toEqual({
        address: "402f2e68",
        path: "44'/6767'/0'/0'/0'",
        publicKey: "c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c51097",
      });
    });

    it("should throw on invalid derivation path", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const canton = new Canton(transport);

      // WHEN & THEN
      return expect(canton.getAddress("invalid path")).rejects.toThrow();
    });

    it("should handle various derivation paths", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e005000015058000002c80001a6f800000008000000080000001
          <= 205e66a10773c0860e73bb6015947806555765df5f9b5b4636df4255a57c57d702205e66a10773c0860e73bb6015947806555765df5f9b5b4636df4255a57c57d7029000
        `),
      );
      const canton = new Canton(transport);

      // WHEN
      const result = await canton.getAddress("44'/6767'/0'/0'/1'");

      // THEN
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
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e006000315058000002c80001a6f800000008000000080000000
          <= 9000
          => e006000420d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd
          <= 40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00009000
        `),
      );
      const canton = new Canton(transport);
      const txHash = "d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd";

      // WHEN
      const result = await canton.signTransaction("44'/6767'/0'/0'/0'", txHash);

      // THEN
      expect(result).toEqual(
        "a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a00",
      );
    });

    it("should handle user refused transaction", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e006010015058000002c80001a6f800000008000000080000000
          <= 6985
        `),
      );
      const canton = new Canton(transport);

      // WHEN & THEN
      return expect(canton.signTransaction("44'/6767'/0'/0'/0'", "test")).rejects.toThrow();
    });
  });

  describe("getAppConfiguration", () => {
    it("should get app configuration", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e003000000
          <= 0202029000
        `),
      );
      const canton = new Canton(transport);

      // WHEN
      const result = await canton.getAppConfiguration();

      // THEN
      expect(result).toEqual({
        version: "2.2.2",
      });
    });

    // should handle configuration error
  });
});
