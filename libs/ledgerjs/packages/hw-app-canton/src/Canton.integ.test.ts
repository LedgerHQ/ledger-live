import SpeculosTransportHttp, { SpeculosButton } from "@ledgerhq/hw-transport-node-speculos-http";
import Canton from "./Canton";

describe("AppCanton", () => {
  let transport: SpeculosTransportHttp;

  beforeAll(async () => {
    transport = await SpeculosTransportHttp.open({});
  });
  afterAll(async () => {
    transport.close();
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
      const derivationPath = "44'/6767'/0'";

      // WHEN
      const result = await app.getAddress(derivationPath);

      // THEN
      expect(result).toEqual({
        address: "canton_1a7a97e0",
        publicKey: "c59f7f29374d24506dd6490a5db472cf00958e195e146f3dc9c97f96d5c51097",
      });
    });
  });

  describe("signTransaction", () => {
    it("returns sign transaction", async () => {
      // GIVEN
      const app = new Canton(transport);
      const derivationPath = "44'/6767'/0'";
      const txHash = "d1e98829444207b0e170346b2e80b58a2ffc602b01e190fb742016d407c84efd";

      // WHEN
      const signPromise = app.signTransaction(derivationPath, txHash);

      // Waiting Speculos receive APDUs
      const delay = (ms: number): Promise<void> => new Promise(f => setTimeout(f, ms));
      await delay(500);
      // Valid transaction butotn interaction sequence
      await transport.button(SpeculosButton.BOTH);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.RIGHT);
      await transport.button(SpeculosButton.BOTH);

      const result = await signPromise;

      // THEN
      expect(result).toEqual(
        "40a65f53c3657bc04efefb67a425ba093a5cb5391d18142f148bb2c48daacf316114cff920a58d5996ca828c7ce265f537f1d7fca8fa82c3c73bd944a96e701a0000",
      );
    });
  });
});
