import { openTransportReplayer, RecordStore } from "@ledgerhq/hw-transport-mocker";
import Concordium from "./Concordium";

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
      expect(typeof concordium.signTransaction).toBe("function");
    });
  });

  describe("getAddress", () => {
    it("should return an empty address and public key", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const concordium = new Concordium(transport);

      // WHEN
      const address = await concordium.getAddress("");

      // THEN
      expect(address).toEqual({ publicKey: "", address: "" });
    });
  });

  describe("signTransaction", () => {
    it("should return an empty signature", async () => {
      // GIVEN
      const transport = await openTransportReplayer(new RecordStore());
      const concordium = new Concordium(transport);

      // WHEN
      const signature = await concordium.signTransaction("", "");

      // THEN
      expect(signature).toEqual("0x");
    });
  });
});
