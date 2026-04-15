import { CosmosApp } from "@zondax/ledger-cosmos-js";
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
    it.each([
      ["with display", true],
      ["without display", false],
      ["without display (default)", undefined],
    ])("gets address and public key %s", async (_, boolDisplay) => {
      const mockResult = {
        bech32_address: "cosmos1abc",
        compressed_pk: "0102030405",
        return_code: 0x9000,
        error_message: "",
      };
      const getAddressAndPubKey = jest
        .spyOn(CosmosApp.prototype, "getAddressAndPubKey")
        .mockResolvedValue(mockResult);

      expect(await signer.getAddressAndPubKey([44, 118, 0, 0, 0], "cosmos", boolDisplay)).toEqual(
        mockResult,
      );
      expect(getAddressAndPubKey).toHaveBeenCalledWith([44, 118, 0, 0, 0], "cosmos", boolDisplay);
    });
  });

  describe("sign", () => {
    it("signs a transaction", async () => {
      const mockResult = {
        signature: Buffer.from("aabbcc", "hex"),
        return_code: 0x9000,
      };
      const sign = jest.spyOn(CosmosApp.prototype, "sign").mockResolvedValue(mockResult);

      const tx = Buffer.from("transaction-data");
      expect(await signer.sign([44, 118, 0, 0, 0], tx, "cosmos")).toEqual(mockResult);
      expect(sign).toHaveBeenCalledWith([44, 118, 0, 0, 0], tx, "cosmos");
    });

    it("signs a transaction without transactionType", async () => {
      const mockResult = {
        signature: Buffer.from("ddeeff", "hex"),
        return_code: 0x9000,
      };
      const sign = jest.spyOn(CosmosApp.prototype, "sign").mockResolvedValue(mockResult);

      const tx = Buffer.from("transaction-data");
      expect(await signer.sign([44, 118, 0, 0, 0], tx)).toEqual(mockResult);
      expect(sign).toHaveBeenCalledWith([44, 118, 0, 0, 0], tx, undefined);
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
      const getAddress = jest
        .spyOn(Cosmos.prototype, "getAddress")
        .mockResolvedValue(mockResult);

      expect(await signer.getAddress("44/118/0/0/0", "cosmos", boolDisplay)).toEqual(mockResult);
      expect(getAddress).toHaveBeenCalledWith("44/118/0/0/0", "cosmos", boolDisplay);
    });
  });
});
