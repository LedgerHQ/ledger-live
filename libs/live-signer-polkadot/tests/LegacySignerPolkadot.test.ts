import Polkadot from "@ledgerhq/hw-app-polkadot";
import Transport from "@ledgerhq/hw-transport";
import { LegacySignerPolkadot } from "../src/LegacySignerPolkadot";

const signer = new LegacySignerPolkadot({
  decorateAppAPIMethods: () => {},
} as unknown as Transport);

describe("LegacySignerPolkadot", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAddress", () => {
    it.each([
      ["with display", true],
      ["without display", false],
      ["without display (default)", undefined],
    ])("gets an address %s, unmodified", async (_, showAddrInDevice) => {
      const mockResult = {
        pubKey: "0a0b0c",
        address: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
        return_code: 0x9000,
      };
      const getAddress = jest.spyOn(Polkadot.prototype, "getAddress").mockResolvedValue(mockResult);

      expect(await signer.getAddress("44/354/0/0/0", 0, showAddrInDevice)).toEqual(mockResult);
      expect(getAddress).toHaveBeenCalledWith("44/354/0/0/0", 0, showAddrInDevice);
    });

    it("forwards the ss58 prefix unmodified, never hardcoding it", async () => {
      const mockResult = {
        pubKey: "0a0b0c",
        address: "F7NZ9mhjS...",
        return_code: 0x9000,
      };
      const getAddress = jest.spyOn(Polkadot.prototype, "getAddress").mockResolvedValue(mockResult);

      await signer.getAddress("44/354/0/0/0", 42);

      expect(getAddress).toHaveBeenCalledWith("44/354/0/0/0", 42, undefined);
    });
  });

  describe("sign", () => {
    it("signs a transaction and forwards the raw metadata hex string unmodified", async () => {
      const mockResult = {
        signature: "00aabbccddeeff",
        return_code: 0x9000,
      };
      const sign = jest.spyOn(Polkadot.prototype, "sign").mockResolvedValue(mockResult);

      const message = new Uint8Array([1, 2, 3]);
      const metadata = "0x1234";
      expect(await signer.sign("44/354/0/0/0", message, metadata)).toEqual(mockResult);
      expect(sign).toHaveBeenCalledWith("44/354/0/0/0", message, metadata);
    });

    it("propagates a rejection from the underlying client unchanged", async () => {
      const error = new Error("device error");
      jest.spyOn(Polkadot.prototype, "sign").mockRejectedValue(error);

      await expect(
        signer.sign("44/354/0/0/0", new Uint8Array([1, 2, 3]), "0x1234"),
      ).rejects.toThrow(error);
    });
  });
});
