import CosmosApp from "@zondax/ledger-cosmos-js";
import Cosmos from "@ledgerhq/hw-app-cosmos";
import Transport from "@ledgerhq/hw-transport";
import { LegacySignerCosmos } from "../src/LegacySignerCosmos";

const signer = new LegacySignerCosmos({
  decorateAppAPIMethods: () => {},
} as unknown as Transport);

describe("LegacySignerCosmos", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAddressAndPubKey", () => {
    const deviceResult = {
      bech32_address: "cosmos1abc",
      compressed_pk: Buffer.from("0102030405", "hex"),
    };
    const expected = { ...deviceResult, return_code: 0x9000, error_message: "" };

    it.each([
      ["without display", false],
      ["without display (default)", undefined],
    ])("gets address and public key %s", async (_, boolDisplay) => {
      const getAddressAndPubKey = jest
        .spyOn(CosmosApp.prototype, "getAddressAndPubKey")
        .mockResolvedValue(deviceResult);
      const showAddressAndPubKey = jest.spyOn(CosmosApp.prototype, "showAddressAndPubKey");

      expect(await signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos", boolDisplay)).toEqual(
        expected,
      );
      expect(getAddressAndPubKey).toHaveBeenCalledWith("m/44'/118'/0'/0/0", "cosmos");
      expect(showAddressAndPubKey).not.toHaveBeenCalled();
    });

    it("shows address and public key on device when display is requested", async () => {
      const showAddressAndPubKey = jest
        .spyOn(CosmosApp.prototype, "showAddressAndPubKey")
        .mockResolvedValue(deviceResult);
      const getAddressAndPubKey = jest.spyOn(CosmosApp.prototype, "getAddressAndPubKey");

      expect(await signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos", true)).toEqual(
        expected,
      );
      expect(showAddressAndPubKey).toHaveBeenCalledWith("m/44'/118'/0'/0/0", "cosmos");
      expect(getAddressAndPubKey).not.toHaveBeenCalled();
    });

    it("rethrows device errors", async () => {
      const error = new Error("device locked");
      jest.spyOn(CosmosApp.prototype, "getAddressAndPubKey").mockRejectedValue(error);

      await expect(signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos")).rejects.toBe(error);
    });
  });

  describe("sign", () => {
    const tx = Buffer.from("transaction-data");

    it("signs a transaction", async () => {
      const signature = Buffer.from("aabbcc", "hex");
      const sign = jest.spyOn(CosmosApp.prototype, "sign").mockResolvedValue({ signature });

      expect(await signer.sign([44, 118, 0, 0, 0], tx, "cosmos")).toEqual({
        signature,
        return_code: 0x9000,
      });
      expect(sign).toHaveBeenCalledWith("m/44'/118'/0'/0/0", tx, "cosmos");
    });

    it("signs a transaction without hrp", async () => {
      const signature = Buffer.from("ddeeff", "hex");
      const sign = jest.spyOn(CosmosApp.prototype, "sign").mockResolvedValue({ signature });

      expect(await signer.sign([44, 118, 0, 0, 0], tx)).toEqual({
        signature,
        return_code: 0x9000,
      });
      expect(sign).toHaveBeenCalledWith("m/44'/118'/0'/0/0", tx, undefined);
    });

    it("forwards the hrp for a coin type outside the ethermint/cosmos gate (1200)", async () => {
      const signature = Buffer.from("aabbcc", "hex");
      const sign = jest.spyOn(CosmosApp.prototype, "sign").mockResolvedValue({ signature });

      expect(await signer.sign([44, 1200, 0, 0, 0], tx, "gonka")).toEqual({
        signature,
        return_code: 0x9000,
      });
      expect(sign).toHaveBeenCalledWith("m/44'/1200'/0'/0/0", tx, "gonka");
    });

    it.each([
      ["expert mode required", 0x6984],
      ["refused on device", 0x6986],
    ])("maps a device status error (%s) to its return code", async (_, returnCode) => {
      jest
        .spyOn(CosmosApp.prototype, "sign")
        .mockRejectedValue({ returnCode, errorMessage: "device error" });

      expect(await signer.sign([44, 118, 0, 0, 0], tx, "cosmos")).toEqual({
        signature: null,
        return_code: returnCode,
      });
    });

    it("rethrows errors without a return code", async () => {
      const error = new Error("unexpected");
      jest.spyOn(CosmosApp.prototype, "sign").mockRejectedValue(error);

      await expect(signer.sign([44, 118, 0, 0, 0], tx, "cosmos")).rejects.toBe(error);
    });
  });

  describe("getAddress", () => {
    it.each([
      ["with display", true],
      ["without display", false],
      ["without display (default)", undefined],
    ])("gets an address %s", async (_, boolDisplay) => {
      const mockResult = {
        publicKey: "0a0b0c",
        address: "cosmos1def",
      };
      const getAddress = jest.spyOn(Cosmos.prototype, "getAddress").mockResolvedValue(mockResult);

      expect(await signer.getAddress("44/118/0/0/0", "cosmos", boolDisplay)).toEqual(mockResult);
      expect(getAddress).toHaveBeenCalledWith("44/118/0/0/0", "cosmos", boolDisplay);
    });
  });
});
