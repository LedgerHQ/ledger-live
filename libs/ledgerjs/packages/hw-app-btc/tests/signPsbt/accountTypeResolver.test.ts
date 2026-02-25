import {
  createAccountTypeFromScriptType,
  determineAccountTypeFromWitnessUtxo,
  createAccountTypeFromAddressFormat,
  determineAccountTypeFromPurpose,
  determineAccountType,
} from "../../src/signPsbt/accountTypeResolver";
import { PsbtV2, SCRIPT_CONSTANTS, detectScriptType } from "@ledgerhq/psbtv2";

const masterFp = Buffer.from([1, 2, 3, 4]);

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

function makeP2pkhScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2PKH.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2PKH.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2PKH.PREFIX[1];
  buf[2] = SCRIPT_CONSTANTS.P2PKH.PREFIX[2];
  buf.fill(4, 3, 23);
  buf[23] = SCRIPT_CONSTANTS.P2PKH.SUFFIX[0];
  buf[24] = SCRIPT_CONSTANTS.P2PKH.SUFFIX[1];
  return buf;
}

describe("accountTypeResolver", () => {
  const psbt = {} as unknown as PsbtV2;

  describe("detectScriptType", () => {
    it("returns p2wpkh for valid P2WPKH scriptPubKey", () => {
      expect(detectScriptType(makeP2wpkhScriptPubKey())).toBe("p2wpkh");
    });

    it("returns p2tr for valid P2TR scriptPubKey", () => {
      expect(detectScriptType(makeP2trScriptPubKey())).toBe("p2tr");
    });

    it("returns p2sh for valid P2SH scriptPubKey", () => {
      expect(detectScriptType(makeP2shScriptPubKey())).toBe("p2sh");
    });

    it("returns p2pkh for valid P2PKH scriptPubKey", () => {
      expect(detectScriptType(makeP2pkhScriptPubKey())).toBe("p2pkh");
    });

    it("returns undefined for unknown script", () => {
      expect(detectScriptType(Buffer.from([0x6a, 0x00]))).toBeUndefined();
    });
  });

  describe("createAccountTypeFromScriptType", () => {
    it("returns account type with wpkh template for p2wpkh", () => {
      const accountType = createAccountTypeFromScriptType("p2wpkh", psbt, masterFp);
      expect(accountType.getDescriptorTemplate()).toBe("wpkh(@0)");
    });

    it("returns account type with tr template for p2tr", () => {
      const accountType = createAccountTypeFromScriptType("p2tr", psbt, masterFp);
      expect(accountType.getDescriptorTemplate()).toBe("tr(@0)");
    });

    it("returns account type with sh(wpkh) template for p2sh and p2sh-p2wpkh", () => {
      expect(createAccountTypeFromScriptType("p2sh", psbt, masterFp).getDescriptorTemplate()).toBe(
        "sh(wpkh(@0))",
      );
      expect(
        createAccountTypeFromScriptType("p2sh-p2wpkh", psbt, masterFp).getDescriptorTemplate(),
      ).toBe("sh(wpkh(@0))");
    });

    it("returns account type with pkh template for p2pkh", () => {
      const accountType = createAccountTypeFromScriptType("p2pkh", psbt, masterFp);
      expect(accountType.getDescriptorTemplate()).toBe("pkh(@0)");
    });
  });

  describe("determineAccountTypeFromWitnessUtxo", () => {
    it("returns null when input has no witness UTXO", () => {
      const psbtNoWitness = {
        getInputWitnessUtxo: () => undefined,
      } as unknown as PsbtV2;
      expect(determineAccountTypeFromWitnessUtxo(psbtNoWitness, 0, masterFp)).toBeNull();
    });

    it("returns account type when witness UTXO has known script type", () => {
      const psbtWithWitness = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2wpkhScriptPubKey() }),
      } as unknown as PsbtV2;
      const result = determineAccountTypeFromWitnessUtxo(psbtWithWitness, 0, masterFp);
      expect(result).not.toBeNull();
      expect(result!.getDescriptorTemplate()).toBe("wpkh(@0)");
    });

    it("throws when witness UTXO has unsupported script type", () => {
      const psbtWithUnknown = {
        getInputWitnessUtxo: () => ({ scriptPubKey: Buffer.from([0x00, 0x01]) }),
      } as unknown as PsbtV2;
      expect(() => determineAccountTypeFromWitnessUtxo(psbtWithUnknown, 0, masterFp)).toThrow(
        /Unsupported script type/,
      );
    });
  });

  describe("createAccountTypeFromAddressFormat", () => {
    it("returns p2pkh for legacy format", () => {
      const accountType = createAccountTypeFromAddressFormat("legacy", psbt, masterFp);
      expect(accountType.getDescriptorTemplate()).toBe("pkh(@0)");
    });

    it("returns p2wpkhWrapped for p2sh format", () => {
      const accountType = createAccountTypeFromAddressFormat("p2sh", psbt, masterFp);
      expect(accountType.getDescriptorTemplate()).toBe("sh(wpkh(@0))");
    });

    it("returns p2wpkh for bech32 format", () => {
      const accountType = createAccountTypeFromAddressFormat("bech32", psbt, masterFp);
      expect(accountType.getDescriptorTemplate()).toBe("wpkh(@0)");
    });

    it("returns p2tr for bech32m format", () => {
      const accountType = createAccountTypeFromAddressFormat("bech32m", psbt, masterFp);
      expect(accountType.getDescriptorTemplate()).toBe("tr(@0)");
    });

    it("throws for unsupported address format", () => {
      expect(() => createAccountTypeFromAddressFormat("unknown" as any, psbt, masterFp)).toThrow(
        /Unsupported address format/,
      );
    });
  });

  describe("determineAccountTypeFromPurpose", () => {
    it("returns null when account path is empty", () => {
      expect(determineAccountTypeFromPurpose([], psbt, masterFp)).toBeNull();
    });

    it("returns p2pkh for purpose 44'", () => {
      const result = determineAccountTypeFromPurpose(
        [0x8000002c, 0x80000000, 0x80000000],
        psbt,
        masterFp,
      );
      expect(result).not.toBeNull();
      expect(result!.getDescriptorTemplate()).toBe("pkh(@0)");
    });

    it("returns p2wpkhWrapped for purpose 49'", () => {
      const result = determineAccountTypeFromPurpose(
        [0x80000031, 0x80000000, 0x80000000],
        psbt,
        masterFp,
      );
      expect(result).not.toBeNull();
      expect(result!.getDescriptorTemplate()).toBe("sh(wpkh(@0))");
    });

    it("returns p2wpkh for purpose 84'", () => {
      const result = determineAccountTypeFromPurpose(
        [0x80000054, 0x80000000, 0x80000000],
        psbt,
        masterFp,
      );
      expect(result).not.toBeNull();
      expect(result!.getDescriptorTemplate()).toBe("wpkh(@0)");
    });

    it("returns p2tr for purpose 86'", () => {
      const result = determineAccountTypeFromPurpose(
        [0x80000056, 0x80000000, 0x80000000],
        psbt,
        masterFp,
      );
      expect(result).not.toBeNull();
      expect(result!.getDescriptorTemplate()).toBe("tr(@0)");
    });

    it("returns null for unknown purpose", () => {
      expect(determineAccountTypeFromPurpose([0x80000000, 0x80000000], psbt, masterFp)).toBeNull();
    });
  });

  describe("determineAccountType", () => {
    it("uses detectedScriptType when provided", () => {
      const result = determineAccountType(psbt, 0, masterFp, "p2tr", [], undefined);
      expect(result.getDescriptorTemplate()).toBe("tr(@0)");
    });

    it("falls back to witness UTXO when no detectedScriptType", () => {
      const psbtWithWitness = {
        getInputWitnessUtxo: () => ({ scriptPubKey: makeP2wpkhScriptPubKey() }),
        getInputRedeemScript: () => undefined,
      } as unknown as PsbtV2;
      const result = determineAccountType(psbtWithWitness, 0, masterFp, undefined, [], undefined);
      expect(result.getDescriptorTemplate()).toBe("wpkh(@0)");
    });

    it("falls back to redeem script (p2sh-p2wpkh) when no witness UTXO", () => {
      const psbtWithRedeem = {
        getInputWitnessUtxo: () => undefined,
        getInputRedeemScript: () => Buffer.alloc(1),
      } as unknown as PsbtV2;
      const result = determineAccountType(psbtWithRedeem, 0, masterFp, undefined, [], undefined);
      expect(result.getDescriptorTemplate()).toBe("sh(wpkh(@0))");
    });

    it("falls back to addressFormat when no witness or redeem script", () => {
      const psbtEmpty = {
        getInputWitnessUtxo: () => undefined,
        getInputRedeemScript: () => undefined,
      } as unknown as PsbtV2;
      const result = determineAccountType(psbtEmpty, 0, masterFp, undefined, [], "bech32m");
      expect(result.getDescriptorTemplate()).toBe("tr(@0)");
    });

    it("falls back to purpose from account path when no addressFormat", () => {
      const psbtEmpty = {
        getInputWitnessUtxo: () => undefined,
        getInputRedeemScript: () => undefined,
      } as unknown as PsbtV2;
      const result = determineAccountType(
        psbtEmpty,
        0,
        masterFp,
        undefined,
        [0x80000054, 0x80000000, 0x80000000],
        undefined,
      );
      expect(result.getDescriptorTemplate()).toBe("wpkh(@0)");
    });

    it("defaults to p2wpkh when no other source available", () => {
      const psbtEmpty = {
        getInputWitnessUtxo: () => undefined,
        getInputRedeemScript: () => undefined,
      } as unknown as PsbtV2;
      const result = determineAccountType(
        psbtEmpty,
        0,
        masterFp,
        undefined,
        [0x80000000],
        undefined,
      );
      expect(result.getDescriptorTemplate()).toBe("wpkh(@0)");
    });
  });
});
