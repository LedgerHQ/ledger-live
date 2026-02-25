import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import { TransportStatusError } from "@ledgerhq/errors";
import Concordium from "./Concordium";

const PATH = "44'/919'/0'/0/0";

describe("Concordium", () => {
  describe("decorateAppAPIMethods", () => {
    it("should properly decorate transport methods", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());

      // WHEN
      const concordium = new Concordium(transport);

      // THEN
      expect(concordium.transport).toBeDefined();
      expect(typeof concordium.getAddress).toBe("function");
      expect(typeof concordium.getPublicKey).toBe("function");
      expect(typeof concordium.verifyAddress).toBe("function");
      expect(typeof concordium.signTransfer).toBe("function");
      expect(typeof concordium.signCredentialDeployment).toBe("function");
    });
  });

  describe("getPublicKey", () => {
    it("should get public key without confirmation", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e001010015058000002c80000397800000000000000000000000
          <= 2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb79000
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN
      const result = await concordium.getPublicKey(PATH, false);

      // THEN
      expect(result).toBe("2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7");
    });

    it("should get public key with confirmation", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e001000015058000002c80000397800000000000000000000000
          <= 2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb79000
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN
      const result = await concordium.getPublicKey(PATH, true);

      // THEN
      expect(result).toBe("2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7");
    });

    it("should throw on invalid derivation path", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const concordium = new Concordium(transport);

      // WHEN & THEN
      await expect(concordium.getPublicKey("invalid-path")).rejects.toThrow();
    });
  });

  describe("getAddress", () => {
    it("should get address without display", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e001010015058000002c80000397800000000000000000000000
          <= 2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb79000
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN
      const result = await concordium.getAddress(PATH, false, 0, 0, 0);

      // THEN
      expect(result).toEqual({
        address: "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7",
        publicKey: "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7",
      });
    });

    it("should get address with display (verify on device)", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e00001000c000000000000000000000000
          <= 40323538306264383366386637373534356563316532363138646434623838653531303039346437376238356539663938323761653164376364653834666262379000
          => e001010015058000002c80000397800000000000000000000000
          <= 2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb79000
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN
      const result = await concordium.getAddress(PATH, true, 0, 0, 0);

      // THEN
      expect(result.publicKey).toBe(
        "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7",
      );
      expect(result.address).toBe(
        "2580bd83f8f77545ec1e2618dd4b88e510094d77b85e9f9827ae1d7cde84fbb7",
      );
    });

    it("should throw on invalid derivation path", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const concordium = new Concordium(transport);

      // WHEN & THEN
      await expect(concordium.getAddress("invalid-path", false, 0, 0, 0)).rejects.toThrow();
    });

    it("should handle user rejected address verification", async () => {
      // GIVEN
      const transport = await openTransportReplayer(
        RecordStore.fromString(`
          => e00001000c000000000000000000000000
          <= 6985
        `),
      );
      const concordium = new Concordium(transport);

      // WHEN & THEN
      await expect(concordium.getAddress(PATH, true, 0, 0, 0)).rejects.toThrow(
        new TransportStatusError(0x6985),
      );
    });
  });
});
