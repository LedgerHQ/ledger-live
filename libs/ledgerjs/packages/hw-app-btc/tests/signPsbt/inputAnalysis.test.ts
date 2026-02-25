import {
  arePathsEqual,
  validateAccountPathConsistency,
  validateScriptTypeConsistency,
  resolveAccountPathFromOptions,
  determineInputScriptType,
  analyzeInput,
  analyzeAllInputs,
} from "../../src/signPsbt/inputAnalysis";
import { PsbtV2, psbtIn, SCRIPT_CONSTANTS } from "@ledgerhq/psbtv2";

function makeP2wpkhScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2WPKH.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2WPKH.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2WPKH.PREFIX[1];
  buf.fill(1, 2);
  return buf;
}

function makeP2trScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2TR.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2TR.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2TR.PREFIX[1];
  buf.fill(2, 2);
  return buf;
}

function makeP2shScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2SH.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2SH.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2SH.PREFIX[1];
  buf.fill(3, 2, buf.length - 1);
  buf[buf.length - 1] = SCRIPT_CONSTANTS.P2SH.SUFFIX[0];
  return buf;
}

describe("inputAnalysis", () => {
  const masterFp = Buffer.from([1, 2, 3, 4]);

  describe("arePathsEqual", () => {
    it("returns true for identical paths", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      expect(arePathsEqual(path, path)).toBe(true);
      expect(arePathsEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    });

    it("returns false when lengths differ", () => {
      expect(arePathsEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(arePathsEqual([1, 2, 3], [1, 2])).toBe(false);
    });

    it("returns false when elements differ", () => {
      expect(arePathsEqual([1, 2, 3], [1, 2, 4])).toBe(false);
    });
  });

  describe("validateAccountPathConsistency", () => {
    it("does not throw when accountPath is empty", () => {
      expect(() =>
        validateAccountPathConsistency([], [0x80000054, 0x80000000, 0x80000000, 0, 0], 0),
      ).not.toThrow();
    });

    it("does not throw when paths are equal", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      expect(() => validateAccountPathConsistency(path, path, 0)).not.toThrow();
    });

    it("throws when paths differ and accountPath is non-empty", () => {
      expect(() =>
        validateAccountPathConsistency(
          [0x80000054, 0x80000000, 0x80000000],
          [0x80000056, 0x80000000, 0x80000000],
          2,
        ),
      ).toThrow(/Mixed accounts detected/);
      expect(() =>
        validateAccountPathConsistency(
          [0x80000054, 0x80000000, 0x80000000],
          [0x80000056, 0x80000000, 0x80000000],
          2,
        ),
      ).toThrow(/Input 2/);
    });
  });

  describe("validateScriptTypeConsistency", () => {
    it("does not throw when either type is undefined", () => {
      expect(() => validateScriptTypeConsistency(undefined, "p2wpkh", 0)).not.toThrow();
      expect(() => validateScriptTypeConsistency("p2wpkh", undefined, 0)).not.toThrow();
    });

    it("does not throw when types match", () => {
      expect(() => validateScriptTypeConsistency("p2wpkh", "p2wpkh", 0)).not.toThrow();
    });

    it("throws when both are set and differ", () => {
      expect(() => validateScriptTypeConsistency("p2wpkh", "p2tr", 1)).toThrow(
        /Mixed input types detected/,
      );
      expect(() => validateScriptTypeConsistency("p2wpkh", "p2tr", 1)).toThrow(/Input 1/);
    });
  });

  describe("resolveAccountPathFromOptions", () => {
    it("throws when accountPathOption is missing", () => {
      expect(() => resolveAccountPathFromOptions()).toThrow(
        /No internal inputs found.*account path provided/,
      );
      expect(() => resolveAccountPathFromOptions(undefined)).toThrow(/accountPath in options/);
    });

    it("returns path array for valid path string", () => {
      expect(resolveAccountPathFromOptions("m/84'/0'/0'")).toEqual([
        0x80000054, 0x80000000, 0x80000000,
      ]);
    });
  });

  describe("determineInputScriptType", () => {
    it("returns p2wpkh when witness UTXO has P2WPKH scriptPubKey", () => {
      const psbt = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2wpkhScriptPubKey() }),
        getInputRedeemScript: () => undefined,
      } as unknown as PsbtV2;
      expect(determineInputScriptType(psbt, 0)).toBe("p2wpkh");
    });

    it("returns p2tr when witness UTXO has P2TR scriptPubKey", () => {
      const psbt = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2trScriptPubKey() }),
        getInputRedeemScript: () => undefined,
      } as unknown as PsbtV2;
      expect(determineInputScriptType(psbt, 0)).toBe("p2tr");
    });

    it("returns p2sh when witness UTXO has P2SH scriptPubKey", () => {
      const psbt = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2shScriptPubKey() }),
        getInputRedeemScript: () => undefined,
      } as unknown as PsbtV2;
      expect(determineInputScriptType(psbt, 0)).toBe("p2sh");
    });

    it("returns p2sh-p2wpkh when redeem script is present and no witness UTXO", () => {
      const psbt = {
        getInputWitnessUtxo: () => undefined,
        getInputRedeemScript: () => Buffer.alloc(1),
      } as unknown as PsbtV2;
      expect(determineInputScriptType(psbt, 0)).toBe("p2sh-p2wpkh");
    });

    it("prefers witness UTXO over redeem script when both present", () => {
      const psbt = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2trScriptPubKey() }),
        getInputRedeemScript: () => Buffer.alloc(1),
      } as unknown as PsbtV2;
      expect(determineInputScriptType(psbt, 0)).toBe("p2tr");
    });

    it("returns undefined when no witness UTXO and no redeem script", () => {
      const psbt = {
        getInputWitnessUtxo: () => undefined,
        getInputRedeemScript: () => undefined,
      } as unknown as PsbtV2;
      expect(determineInputScriptType(psbt, 0)).toBeUndefined();
    });
  });

  describe("analyzeInput", () => {
    it("returns belongsToSigner and accountPath from BIP32 derivation when fingerprint matches", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const psbt = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2wpkhScriptPubKey() }),
        getInputRedeemScript: () => undefined,
        getInputKeyDatas: (_i: number, keyType: number) =>
          keyType === psbtIn.BIP32_DERIVATION ? [Buffer.alloc(33, 1)] : [],
        getInputBip32Derivation: () => ({ path, masterFingerprint: masterFp }),
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      const result = analyzeInput(psbt, 0, masterFp);
      expect(result.belongsToSigner).toBe(true);
      expect(result.accountPath).toEqual([0x80000054, 0x80000000, 0x80000000]);
      expect(result.scriptType).toBe("p2wpkh");
    });

    it("returns belongsToSigner false when no matching derivation", () => {
      const otherFp = Buffer.from([9, 9, 9, 9]);
      const psbt = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2wpkhScriptPubKey() }),
        getInputRedeemScript: () => undefined,
        getInputKeyDatas: () => [],
        getInputBip32Derivation: () => null,
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      const result = analyzeInput(psbt, 0, masterFp);
      expect(result.belongsToSigner).toBe(false);
      expect(result.accountPath).toEqual([]);
      expect(result.scriptType).toBe("p2wpkh");
    });
  });

  describe("analyzeAllInputs", () => {
    it("returns only internal input indices and resolved account path from options when no internal inputs", () => {
      const psbt = {
        getInputWitnessUtxo: () => undefined,
        getInputRedeemScript: () => undefined,
        getInputKeyDatas: () => [],
        getInputBip32Derivation: () => null,
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      const result = analyzeAllInputs(psbt, 2, masterFp, "m/84'/0'/0'");
      expect(result.internalInputIndices).toEqual([]);
      expect(result.accountPath).toEqual([0x80000054, 0x80000000, 0x80000000]);
      expect(result.detectedScriptType).toBeUndefined();
    });

    it("throws when no internal inputs and no accountPathOption", () => {
      const psbt = {
        getInputWitnessUtxo: () => undefined,
        getInputRedeemScript: () => undefined,
        getInputKeyDatas: () => [],
        getInputBip32Derivation: () => null,
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      expect(() => analyzeAllInputs(psbt, 1, masterFp)).toThrow(/No internal inputs found/);
    });

    it("aggregates internal inputs and detects script type when all internal", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const psbt = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2wpkhScriptPubKey() }),
        getInputRedeemScript: () => undefined,
        getInputKeyDatas: (_i: number, keyType: number) =>
          keyType === psbtIn.BIP32_DERIVATION ? [Buffer.alloc(33, 1)] : [],
        getInputBip32Derivation: () => ({ path, masterFingerprint: masterFp }),
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      const result = analyzeAllInputs(psbt, 2, masterFp);
      expect(result.internalInputIndices).toEqual([0, 1]);
      expect(result.accountPath).toEqual([0x80000054, 0x80000000, 0x80000000]);
      expect(result.detectedScriptType).toBe("p2wpkh");
    });

    it("throws when internal inputs have mixed account paths", () => {
      const path1 = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const path2 = [0x80000056, 0x80000000, 0x80000000, 0, 0];
      let callCount = 0;
      const psbt = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2wpkhScriptPubKey() }),
        getInputRedeemScript: () => undefined,
        getInputKeyDatas: (_i: number, keyType: number) =>
          keyType === psbtIn.BIP32_DERIVATION ? [Buffer.alloc(33, 1)] : [],
        getInputBip32Derivation: () => {
          callCount++;
          return {
            path: callCount === 1 ? path1 : path2,
            masterFingerprint: masterFp,
          };
        },
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      expect(() => analyzeAllInputs(psbt, 2, masterFp)).toThrow(/Mixed accounts detected/);
    });

    it("throws when internal inputs have mixed script types", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const psbt = {
        getInputWitnessUtxo: (i: number) => ({
          scriptPubKey: i === 0 ? makeP2wpkhScriptPubKey() : makeP2trScriptPubKey(),
        }),
        getInputRedeemScript: () => undefined,
        getInputKeyDatas: (_i: number, keyType: number) =>
          keyType === psbtIn.BIP32_DERIVATION ? [Buffer.alloc(33, 1)] : [],
        getInputBip32Derivation: () => ({ path, masterFingerprint: masterFp }),
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      expect(() => {
        analyzeAllInputs(psbt, 2, masterFp);
      }).toThrow(/Mixed input types detected/);
    });

    it("skips external inputs and only includes internal indices", () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const psbt = {
        getInputWitnessUtxo: (_i: number) =>
          _i === 1 ? { scriptPubKey: makeP2wpkhScriptPubKey() } : undefined,
        getInputRedeemScript: () => undefined,
        getInputKeyDatas: (_i: number, keyType: number) =>
          _i === 1 && keyType === psbtIn.BIP32_DERIVATION ? [Buffer.alloc(33, 1)] : [],
        getInputBip32Derivation: (i: number) =>
          i === 1 ? { path, masterFingerprint: masterFp } : null,
        getInputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      const result = analyzeAllInputs(psbt, 3, masterFp);
      expect(result.internalInputIndices).toEqual([1]);
      expect(result.accountPath).toEqual([0x80000054, 0x80000000, 0x80000000]);
      expect(result.detectedScriptType).toBe("p2wpkh");
    });
  });
});
