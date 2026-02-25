import {
  getDerivationAccessors,
  checkElementBip32Derivation,
  extractAccountPath,
  checkBip32Derivation,
  checkOutputBip32Derivation,
} from "../../src/signPsbt/derivationAccessors";
import { PsbtV2, psbtIn, psbtOut } from "@ledgerhq/psbtv2";

const masterFp = Buffer.from([1, 2, 3, 4]);

describe("derivationAccessors", () => {
  describe("getDerivationAccessors", () => {
    it("returns input accessors when type is input", () => {
      const getInputKeyDatas = jest.fn().mockReturnValue([]);
      const psbt = {
        getInputKeyDatas: getInputKeyDatas,
        getInputBip32Derivation: jest.fn(),
        getInputTapBip32Derivation: jest.fn(),
        setInputBip32Derivation: jest.fn(),
        setInputTapBip32Derivation: jest.fn(),
      } as unknown as PsbtV2;
      const accessors = getDerivationAccessors(psbt, "input");
      accessors.getKeyDatas(0, accessors.bip32KeyType);
      expect(getInputKeyDatas).toHaveBeenCalledWith(0, psbtIn.BIP32_DERIVATION);
      expect(accessors.bip32KeyType).toBe(psbtIn.BIP32_DERIVATION);
      expect(accessors.tapBip32KeyType).toBe(psbtIn.TAP_BIP32_DERIVATION);
    });

    it("returns output accessors when type is output", () => {
      const getOutputKeyDatas = jest.fn().mockReturnValue([]);
      const psbt = {
        getOutputKeyDatas: getOutputKeyDatas,
        getOutputBip32Derivation: jest.fn(),
        getOutputTapBip32Derivation: jest.fn(),
        setOutputBip32Derivation: jest.fn(),
        setOutputTapBip32Derivation: jest.fn(),
      } as unknown as PsbtV2;
      const accessors = getDerivationAccessors(psbt, "output");
      accessors.getKeyDatas(0, accessors.bip32KeyType);
      expect(getOutputKeyDatas).toHaveBeenCalledWith(0, psbtOut.BIP_32_DERIVATION);
      expect(accessors.bip32KeyType).toBe(psbtOut.BIP_32_DERIVATION);
      expect(accessors.tapBip32KeyType).toBe(psbtOut.TAP_BIP32_DERIVATION);
    });
  });

  describe("checkElementBip32Derivation", () => {
    it("returns belongsToSigner true and account path when BIP32 derivation matches fingerprint", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const accessors = {
        getKeyDatas: (_i: number, kt: number) =>
          kt === psbtIn.BIP32_DERIVATION ? [Buffer.alloc(33, 1)] : [],
        getBip32Derivation: () => ({ path, masterFingerprint: masterFp }),
        getTapBip32Derivation: () => undefined,
        setBip32Derivation: jest.fn(),
        setTapBip32Derivation: jest.fn(),
        bip32KeyType: psbtIn.BIP32_DERIVATION,
        tapBip32KeyType: psbtIn.TAP_BIP32_DERIVATION,
      };
      const result = checkElementBip32Derivation(accessors as any, 0, masterFp);
      expect(result.belongsToSigner).toBe(true);
      expect(result.accountPath).toEqual([0x80000054, 0x80000000, 0x80000000]);
    });

    it("returns belongsToSigner true from Tap BIP32 derivation when fingerprint matches", () => {
      const path = [0x80000056, 0x80000000, 0x80000000, 1, 0];
      const accessors = {
        getKeyDatas: (_i: number, kt: number) =>
          kt === psbtIn.TAP_BIP32_DERIVATION ? [Buffer.alloc(32, 2)] : [],
        getBip32Derivation: () => undefined,
        getTapBip32Derivation: () => ({ path, masterFingerprint: masterFp, hashes: [] }),
        setBip32Derivation: jest.fn(),
        setTapBip32Derivation: jest.fn(),
        bip32KeyType: psbtIn.BIP32_DERIVATION,
        tapBip32KeyType: psbtIn.TAP_BIP32_DERIVATION,
      };
      const result = checkElementBip32Derivation(accessors as any, 0, masterFp);
      expect(result.belongsToSigner).toBe(true);
      expect(result.accountPath).toEqual([0x80000056, 0x80000000, 0x80000000]);
    });

    it("returns belongsToSigner false when no derivation matches fingerprint", () => {
      const accessors = {
        getKeyDatas: () => [],
        getBip32Derivation: () => null,
        getTapBip32Derivation: () => null,
        setBip32Derivation: jest.fn(),
        setTapBip32Derivation: jest.fn(),
        bip32KeyType: psbtIn.BIP32_DERIVATION,
        tapBip32KeyType: psbtIn.TAP_BIP32_DERIVATION,
      };
      const result = checkElementBip32Derivation(accessors as any, 0, masterFp);
      expect(result.belongsToSigner).toBe(false);
      expect(result.accountPath).toEqual([]);
    });
  });

  describe("extractAccountPath", () => {
    it("returns path without last two elements when fullPath has at least 2 elements", () => {
      const fullPath = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const result = extractAccountPath(fullPath);
      expect(result.belongsToSigner).toBe(true);
      expect(result.accountPath).toEqual([0x80000054, 0x80000000, 0x80000000]);
    });

    it("returns empty account path when fullPath has fewer than 2 elements", () => {
      const result = extractAccountPath([0x80000054]);
      expect(result.belongsToSigner).toBe(true);
      expect(result.accountPath).toEqual([]);
    });

    it("returns empty account path for empty fullPath", () => {
      const result = extractAccountPath([]);
      expect(result.belongsToSigner).toBe(true);
      expect(result.accountPath).toEqual([]);
    });
  });

  describe("checkBip32Derivation", () => {
    it("delegates to element check for input and returns result", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const psbt = {
        getInputKeyDatas: (_i: number, kt: number) =>
          kt === psbtIn.BIP32_DERIVATION ? [Buffer.alloc(33, 1)] : [],
        getInputBip32Derivation: () => ({ path, masterFingerprint: masterFp }),
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      const result = checkBip32Derivation(psbt, 0, masterFp);
      expect(result.belongsToSigner).toBe(true);
      expect(result.accountPath).toEqual([0x80000054, 0x80000000, 0x80000000]);
    });
  });

  describe("checkOutputBip32Derivation", () => {
    it("returns true when output has matching BIP32 derivation", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 1, 0];
      const psbt = {
        getOutputKeyDatas: (_i: number, kt: number) =>
          kt === psbtOut.BIP_32_DERIVATION ? [Buffer.alloc(33, 1)] : [],
        getOutputBip32Derivation: () => ({ path, masterFingerprint: masterFp }),
        getOutputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      expect(checkOutputBip32Derivation(psbt, 0, masterFp)).toBe(true);
    });

    it("returns false when output has no matching derivation", () => {
      const psbt = {
        getOutputKeyDatas: () => [],
        getOutputBip32Derivation: () => null,
        getOutputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      expect(checkOutputBip32Derivation(psbt, 0, masterFp)).toBe(false);
    });
  });
});
