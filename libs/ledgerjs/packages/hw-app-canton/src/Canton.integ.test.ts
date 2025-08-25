// import Transport from "@ledgerhq/hw-transport";
import SpeculosTransportHttp from "@ledgerhq/hw-transport-node-speculos-http";
import Canton from "./Canton";
import Transport from "@ledgerhq/hw-transport";

describe("AppCanton", () => {
  let transport: Transport;

  beforeAll(async () => {
    transport = await SpeculosTransportHttp.open({});
  });

  describe("getAppConfiguration", () => {
    it("returns app version", async () => {
      // GIVEN
      const app = new Canton(transport);

      // WHEN
      const result = await app.getAppConfiguration();

      // THEN
      expect(result).toEqual({
        version: "2.2.2",
      });
    });
  });

  describe("getAddress", () => {
    it("retrieves address from app", async () => {
      // GIVEN
      const app = new Canton(transport);
      const derivationPath = "44'/6767'/0'/0'/0'";

      // WHEN
      const result = await app.getAddress(derivationPath);

      // THEN
      expect(result).toEqual({
        address: "canton_10cd9ed0",
        publicKey:
          "0x043b462de34ec31fba274f2a381947aef26697912194312fc289c46cc1b2b4f6b00828dc1e4f96001b10463083edf85f2e0550862a3dc99ed411ca6d25f2bc19a8",
      });
    });
  });

  describe("signTransaction", () => {
    it.todo("returns sign transaction");
  });
});
