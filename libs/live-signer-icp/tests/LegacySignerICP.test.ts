import Transport from "@ledgerhq/hw-transport";
import ICP from "@zondax/ledger-icp";
import { LegacySignerICP } from "../src/LegacySignerICP";

const DERIVATION_PATH = "44'/223'/0'/0/0";
const PREFIXED_PATH = "m/44'/223'/0'/0/0";

const signer = new LegacySignerICP({
  decorateAppAPIMethods: () => {},
} as unknown as Transport);

describe("LegacySignerICP", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("getAppConfiguration", () => {
    it("normalizes the Zondax version response", async () => {
      jest.spyOn(ICP.prototype, "getVersion").mockResolvedValue({
        returnCode: 0x9000,
        errorMessage: "No errors",
        major: 2,
        minor: 3,
        patch: 1,
        testMode: false,
        deviceLocked: true,
      } as any);

      expect(await signer.getAppConfiguration()).toEqual({
        version: "2.3.1",
        testMode: false,
        locked: true,
      });
    });

    it("throws when the device returns a non-success code", async () => {
      jest.spyOn(ICP.prototype, "getVersion").mockResolvedValue({
        returnCode: 0x6982,
        errorMessage: "Empty buffer",
      } as any);

      await expect(signer.getAppConfiguration()).rejects.toThrow("27010 - Empty buffer");
    });

    it("defaults missing version components to 0", async () => {
      jest.spyOn(ICP.prototype, "getVersion").mockResolvedValue({
        returnCode: 0x9000,
        errorMessage: "No errors",
      } as any);

      expect(await signer.getAppConfiguration()).toEqual({
        version: "0.0.0",
        testMode: false,
        locked: false,
      });
    });
  });

  describe("getAddressAndPubKey", () => {
    it("prefixes the path with m/ and returns the Zondax response verbatim", async () => {
      const mockResult = {
        returnCode: 0x9000,
        errorMessage: "No errors",
        publicKey: Buffer.from("0102", "hex"),
        address: Buffer.from("0a0b", "hex"),
        principalText: "2vxsx-fae",
      };
      const spy = jest
        .spyOn(ICP.prototype, "getAddressAndPubKey")
        .mockResolvedValue(mockResult as any);

      expect(await signer.getAddressAndPubKey(DERIVATION_PATH)).toEqual(mockResult);
      expect(spy).toHaveBeenCalledWith(PREFIXED_PATH);
    });

    it("leaves an already-prefixed path unchanged", async () => {
      const spy = jest
        .spyOn(ICP.prototype, "getAddressAndPubKey")
        .mockResolvedValue({ returnCode: 0x9000, errorMessage: "" } as any);

      await signer.getAddressAndPubKey(PREFIXED_PATH);
      expect(spy).toHaveBeenCalledWith(PREFIXED_PATH);
    });
  });

  describe("showAddressAndPubKey", () => {
    it("prefixes the path with m/ and returns the Zondax response verbatim", async () => {
      const mockResult = {
        returnCode: 0x9000,
        errorMessage: "No errors",
        publicKey: Buffer.from("0102", "hex"),
        address: Buffer.from("0a0b", "hex"),
        principalText: "2vxsx-fae",
      };
      const spy = jest
        .spyOn(ICP.prototype, "showAddressAndPubKey")
        .mockResolvedValue(mockResult as any);

      expect(await signer.showAddressAndPubKey(DERIVATION_PATH)).toEqual(mockResult);
      expect(spy).toHaveBeenCalledWith(PREFIXED_PATH);
    });
  });

  describe("sign", () => {
    it("signs a plain transfer (txtype 0) against the prefixed path", async () => {
      const mockResult = {
        returnCode: 0x9000,
        errorMessage: "No errors",
        signatureRS: Buffer.from("aabb", "hex"),
        signatureDER: Buffer.from("3006", "hex"),
      };
      const spy = jest.spyOn(ICP.prototype, "sign").mockResolvedValue(mockResult as any);

      const message = Buffer.from("deadbeef", "hex");
      expect(await signer.sign(DERIVATION_PATH, message)).toEqual(mockResult);
      expect(spy).toHaveBeenCalledWith(PREFIXED_PATH, message, 0);
    });

    it("throws when the device returns a non-success code", async () => {
      jest.spyOn(ICP.prototype, "sign").mockResolvedValue({
        returnCode: 0x6986,
        errorMessage: "Command not allowed",
      } as any);

      await expect(signer.sign(DERIVATION_PATH, Buffer.from("tx"))).rejects.toThrow(
        "27014 - Command not allowed",
      );
    });
  });
});
