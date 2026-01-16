import { NoSuchEntry, PsbtV2, psbtGlobal, psbtIn, parseBip32Path } from "./psbtv2";
import { Psbt, networks } from "bitcoinjs-lib";

describe("PsbtV2", () => {
  it("deserializes a psbt and reserializes it unchanged", async () => {
    const psbtBuf = Buffer.from(
      "cHNidP8BAAoBAAAAAAAAAAAAAQIEAgAAAAEDBAAAAAABBAECAQUBAgH7BAIAAAAAAQBxAgAAAAGTarLgEHL3k8/kyXdU3hth/gPn22U2yLLyHdC1dCxIRQEAAAAA/v///wLe4ccAAAAAABYAFOt418QL8QY7Dj/OKcNWW2ichVmrECcAAAAAAAAWABQjGNZvhP71xIdfkzsDjcY4MfjaE/mXHgABAR8QJwAAAAAAABYAFCMY1m+E/vXEh1+TOwONxjgx+NoTIgYDRV7nztyXsLpDW4AGb8ksljo0xgAxeYHRNTMMTuQ6x6MY9azC/VQAAIABAACAAAAAgAAAAAABAAAAAQ4gniz+J/Cth7eKI31ddAXUowZmyjYdWFpGew3+QiYrTbQBDwQBAAAAARAE/f///wESBAAAAAAAAQBxAQAAAAEORx706Sway1HvyGYPjT9pk26pybK/9y/5vIHFHvz0ZAEAAAAAAAAAAAJgrgoAAAAAABYAFDXG4N1tPISxa6iF3Kc6yGPQtZPsrwYyAAAAAAAWABTcKG4M0ua9N86+nsNJ+18IkFZy/AAAAAABAR9grgoAAAAAABYAFDXG4N1tPISxa6iF3Kc6yGPQtZPsIgYCcbW3ea2HCDhYd5e89vDHrsWr52pwnXJPSNLibPh08KAY9azC/VQAAIABAACAAAAAgAEAAAAAAAAAAQ4gr7+uBlkPdB/xr1m2rEYRJjNqTEqC21U99v76tzesM/MBDwQAAAAAARAE/f///wESBAAAAAAAIgICKexHcnEx7SWIogxG7amrt9qm9J/VC6/nC5xappYcTswY9azC/VQAAIABAACAAAAAgAEAAAAKAAAAAQMIqDoGAAAAAAABBBYAFOs4+puBKPgfJule2wxf+uqDaQ/kAAEDCOCTBAAAAAAAAQQiACA/qWbJ3c3C/ZbkpeG8dlufr2zos+tPEQSq1r33cyTlvgA=",
      "base64",
    );

    const psbt = new PsbtV2();
    psbt.deserialize(psbtBuf);

    expect(psbt.serialize()).toEqual(psbtBuf);
  });

  describe("getPsbtVersionNumber", () => {
    it("should return 2 for a PSBTv2 buffer", () => {
      // Create a PSBTv2
      const psbtv2 = new PsbtV2();
      psbtv2.setGlobalTxVersion(2);
      psbtv2.setGlobalInputCount(0);
      psbtv2.setGlobalOutputCount(0);
      psbtv2.setGlobalPsbtVersion(2);

      const buffer = psbtv2.serialize();
      const version = PsbtV2.getPsbtVersionNumber(buffer);

      expect(version).toBe(2);
    });

    it("should return 0 for a PSBTv0 buffer (no version field)", () => {
      // Create a PSBTv0 using bitcoinjs-lib
      const psbtv0 = new Psbt({ network: networks.testnet });
      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 100000,
        },
      });
      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      const buffer = psbtv0.toBuffer();
      const version = PsbtV2.getPsbtVersionNumber(buffer);

      expect(version).toBe(0);
    });

    it("should return 0 for a minimal PSBTv0", () => {
      // Minimal PSBTv0: magic bytes + empty global map (0x00) + empty input/output
      const psbtv0 = new Psbt({ network: networks.testnet });
      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 1),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("001400000000000000000000000000000000000000000000", "hex"),
          value: 1000,
        },
      });
      psbtv0.addOutput({
        script: Buffer.from("001400000000000000000000000000000000000000000000", "hex"),
        value: 900,
      });

      const buffer = psbtv0.toBuffer();
      const version = PsbtV2.getPsbtVersionNumber(buffer);

      expect(version).toBe(0);
    });

    it("should correctly identify version in a converted PSBTv2", () => {
      // Create a PSBTv0 and convert it to PSBTv2
      const psbtv0 = new Psbt({ network: networks.testnet });
      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 100000,
        },
      });
      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);
      const buffer = psbtv2.serialize();
      const version = PsbtV2.getPsbtVersionNumber(buffer);

      expect(version).toBe(2);
    });

    it("should handle the version field from the test PSBT", () => {
      const psbtBuf = Buffer.from(
        "cHNidP8BAAoBAAAAAAAAAAAAAQIEAgAAAAEDBAAAAAABBAECAQUBAgH7BAIAAAAAAQBxAgAAAAGTarLgEHL3k8/kyXdU3hth/gPn22U2yLLyHdC1dCxIRQEAAAAA/v///wLe4ccAAAAAABYAFOt418QL8QY7Dj/OKcNWW2ichVmrECcAAAAAAAAWABQjGNZvhP71xIdfkzsDjcY4MfjaE/mXHgABAR8QJwAAAAAAABYAFCMY1m+E/vXEh1+TOwONxjgx+NoTIgYDRV7nztyXsLpDW4AGb8ksljo0xgAxeYHRNTMMTuQ6x6MY9azC/VQAAIABAACAAAAAgAAAAAABAAAAAQ4gniz+J/Cth7eKI31ddAXUowZmyjYdWFpGew3+QiYrTbQBDwQBAAAAARAE/f///wESBAAAAAAAAQBxAQAAAAEORx706Sway1HvyGYPjT9pk26pybK/9y/5vIHFHvz0ZAEAAAAAAAAAAAJgrgoAAAAAABYAFDXG4N1tPISxa6iF3Kc6yGPQtZPsrwYyAAAAAAAWABTcKG4M0ua9N86+nsNJ+18IkFZy/AAAAAABAR9grgoAAAAAABYAFDXG4N1tPISxa6iF3Kc6yGPQtZPsIgYCcbW3ea2HCDhYd5e89vDHrsWr52pwnXJPSNLibPh08KAY9azC/VQAAIABAACAAAAAgAEAAAAAAAAAAQ4gr7+uBlkPdB/xr1m2rEYRJjNqTEqC21U99v76tzesM/MBDwQAAAAAARAE/f///wESBAAAAAAAIgICKexHcnEx7SWIogxG7amrt9qm9J/VC6/nC5xappYcTswY9azC/VQAAIABAACAAAAAgAEAAAAKAAAAAQMIqDoGAAAAAAABBBYAFOs4+puBKPgfJule2wxf+uqDaQ/kAAEDCOCTBAAAAAAAAQQiACA/qWbJ3c3C/ZbkpeG8dlufr2zos+tPEQSq1r33cyTlvgA=",
        "base64",
      );

      const version = PsbtV2.getPsbtVersionNumber(psbtBuf);
      expect(version).toBe(2);
    });

    it("should return 0 when PSBTv2 has no explicit VERSION field", () => {
      const psbtv2 = new PsbtV2();
      const buffer = psbtv2.serialize();

      const version = PsbtV2.getPsbtVersionNumber(buffer);

      expect(version).toBe(0);
    });

    it("should handle global keys with key data and empty values", () => {
      const magic = Buffer.from([0x70, 0x73, 0x62, 0x74, 0xff]);

      // Manually craft a minimal PSBT-like buffer:
      // - One global key with keyLen = 2 (type + 1 byte keyData)
      // - valueLen = 0 (empty value)
      // - followed by keyLen = 0 as global-map terminator
      const body = Buffer.from([
        0x02, // keyLen = 2
        psbtGlobal.TX_VERSION, // keyType
        0x99, // keyData (ignored by version parser)
        0x00, // valueLen = 0
        0x00, // next keyLen = 0 -> end of global map
      ]);

      const buffer = Buffer.concat([magic, body]);

      const version = PsbtV2.getPsbtVersionNumber(buffer);

      expect(version).toBe(0);
    });
  });

  describe("optional getters and taproot helpers", () => {
    it("should return undefined for optional globals and inputs when not set", () => {
      const psbtv2 = new PsbtV2();

      expect(psbtv2.getGlobalFallbackLocktime()).toBeUndefined();

      // Ensure input map exists but no optional fields are set
      psbtv2.setInputSequence(0, 0xfffffffe);

      expect(psbtv2.getInputSighashType(0)).toBeUndefined();
      expect(psbtv2.getInputTapKeySig(0)).toBeUndefined();

      const witnessUtxo = psbtv2.getInputWitnessUtxo(0);
      expect(witnessUtxo).toBeUndefined();

      const bip32Deriv = psbtv2.getInputBip32Derivation(0, Buffer.alloc(33, 2));
      expect(bip32Deriv).toBeUndefined();
    });

    it("should encode and decode taproot BIP32 derivation for inputs and outputs", () => {
      const psbtv2 = new PsbtV2();

      const pubkey = Buffer.alloc(32, 1);
      const hashes = [Buffer.alloc(32, 2), Buffer.alloc(32, 3)];
      const masterFingerprint = Buffer.from("01020304", "hex");
      const path = [0x8000002c, 0x80000001, 0x80000000, 0, 5];

      psbtv2.setInputTapBip32Derivation(0, pubkey, hashes, masterFingerprint, path);
      psbtv2.setOutputTapBip32Derivation(0, pubkey, hashes, masterFingerprint, path);

      const inputDeriv = psbtv2.getInputTapBip32Derivation(0, pubkey);
      expect(inputDeriv.hashes).toHaveLength(2);
      expect(inputDeriv.hashes[0]).toEqual(hashes[0]);
      expect(inputDeriv.hashes[1]).toEqual(hashes[1]);
      expect(inputDeriv.masterFingerprint).toEqual(masterFingerprint);
      expect(inputDeriv.path).toEqual(path);

      const outputDeriv = psbtv2.getOutputTapBip32Derivation(0, pubkey);
      expect(outputDeriv.hashes).toHaveLength(2);
      expect(outputDeriv.hashes[0]).toEqual(hashes[0]);
      expect(outputDeriv.hashes[1]).toEqual(hashes[1]);
      expect(outputDeriv.masterFingerprint).toEqual(masterFingerprint);
      expect(outputDeriv.path).toEqual(path);

      const keyDatas = psbtv2.getInputKeyDatas(0, psbtIn.TAP_BIP32_DERIVATION);
      expect(keyDatas).toHaveLength(1);
      expect(keyDatas[0]).toEqual(pubkey);
    });

    it("should delete specified input entries and throw when accessing them afterwards", () => {
      const psbtv2 = new PsbtV2();

      const pubkey = Buffer.alloc(32, 9);
      const hashes = [Buffer.alloc(32, 4)];
      const masterFingerprint = Buffer.from("0a0b0c0d", "hex");
      const path = [0x8000002c, 0x80000001, 0x80000000, 1, 0];

      psbtv2.setInputTapBip32Derivation(0, pubkey, hashes, masterFingerprint, path);

      expect(() => psbtv2.getInputTapBip32Derivation(0, pubkey)).not.toThrow();

      psbtv2.deleteInputEntries(0, [psbtIn.TAP_BIP32_DERIVATION]);

      expect(() => psbtv2.getInputTapBip32Derivation(0, pubkey)).toThrow(NoSuchEntry);
    });

    it("should set and get txModifiable global flag", () => {
      const psbtv2 = new PsbtV2();

      expect(psbtv2.getGlobalTxModifiable()).toBeUndefined();

      const flag = Buffer.from([0x01]);
      psbtv2.setGlobalTxModifiable(flag);

      expect(psbtv2.getGlobalTxModifiable()).toEqual(flag);
    });

    it("should default input sequence to 0xffffffff when not set", () => {
      const psbtv2 = new PsbtV2();

      const prevTxId = Buffer.alloc(32, 0);
      psbtv2.setInputPreviousTxId(0, prevTxId);

      expect(psbtv2.getInputSequence(0)).toBe(0xffffffff);
    });

    it("should throw when accessing required input data for a non-existent map", () => {
      const psbtv2 = new PsbtV2();

      expect(() => psbtv2.getInputFinalScriptwitness(0)).toThrow("No such map");
    });

    it("should support taproot derivation with empty hashes vector", () => {
      const psbtv2 = new PsbtV2();

      const pubkey = Buffer.alloc(32, 7);
      const hashes: Buffer[] = [];
      const masterFingerprint = Buffer.from("01020304", "hex");
      const path = [0x8000002c, 0x80000001];

      psbtv2.setInputTapBip32Derivation(0, pubkey, hashes, masterFingerprint, path);

      const deriv = psbtv2.getInputTapBip32Derivation(0, pubkey);
      expect(deriv.hashes).toHaveLength(0);
      expect(deriv.masterFingerprint).toEqual(masterFingerprint);
      expect(deriv.path).toEqual(path);
    });

    it("should validate BIP32 input pubkey length", () => {
      const psbtv2 = new PsbtV2();

      const invalidPubkey = Buffer.alloc(32, 1); // must be 33 bytes
      const masterFingerprint = Buffer.from("01020304", "hex");

      expect(() =>
        psbtv2.setInputBip32Derivation(0, invalidPubkey, masterFingerprint, [0x8000002c]),
      ).toThrow("Invalid pubkey length: 32");
    });

    it("should validate taproot BIP32 pubkey length", () => {
      const psbtv2 = new PsbtV2();

      const invalidPubkey = Buffer.alloc(33, 1); // must be 32 bytes
      const masterFingerprint = Buffer.from("01020304", "hex");

      expect(() =>
        psbtv2.setInputTapBip32Derivation(0, invalidPubkey, [], masterFingerprint, [0]),
      ).toThrow("Invalid pubkey length: 33");
    });

    it("should parse and validate BIP32 string paths", () => {
      const validPath = "m/84'/1'/0'/0/0";
      expect(parseBip32Path(validPath)).toEqual([
        0x80000054, // 84'
        0x80000001, // 1'
        0x80000000, // 0'
        0, // 0
        0, // 0
      ]);

      const invalidPath = "m/84'/1'/foo/0/0";
      expect(() => parseBip32Path(invalidPath)).toThrow(/Invalid BIP32 path segment/);
    });

    it("should set and get taproot key signature", () => {
      const psbtv2 = new PsbtV2();

      const sig = Buffer.from("aa", "hex");
      psbtv2.setInputTapKeySig(0, sig);

      const storedSig = psbtv2.getInputTapKeySig(0);
      expect(storedSig).toEqual(sig);
    });

    it("should set and get output redeem script", () => {
      const psbtv2 = new PsbtV2();

      const redeemScript = Buffer.from("0014" + "22".repeat(20), "hex");

      psbtv2.setOutputRedeemScript(0, redeemScript);

      const outRedeemScript = psbtv2.getOutputRedeemScript(0);
      expect(outRedeemScript).toEqual(redeemScript);
    });

    it("should copy psbtv2 state deeply", () => {
      const source = new PsbtV2();
      source.setGlobalTxVersion(2);
      source.setGlobalInputCount(1);
      source.setGlobalOutputCount(1);
      source.setGlobalPsbtVersion(2);

      const prevTxId = Buffer.alloc(32, 1);
      const script = Buffer.from("0014" + "00".repeat(20), "hex");

      source.setInputPreviousTxId(0, prevTxId);
      source.setInputSequence(0, 0xfffffffe);
      source.setInputWitnessUtxo(0, Buffer.alloc(8, 1), script);

      source.setOutputAmount(0, 100000);
      source.setOutputScript(0, script);

      const target = new PsbtV2();
      source.copy(target);

      expect(target.getGlobalTxVersion()).toBe(2);
      expect(target.getGlobalInputCount()).toBe(1);
      expect(target.getGlobalOutputCount()).toBe(1);
      expect(target.getGlobalPsbtVersion()).toBe(2);

      expect(target.getInputPreviousTxid(0)).toEqual(prevTxId);
      expect(target.getInputSequence(0)).toBe(0xfffffffe);

      const witness = target.getInputWitnessUtxo(0);
      expect(witness).toBeDefined();
      expect(witness!.scriptPubKey).toEqual(script);

      expect(target.getOutputAmount(0)).toBe(100000);
      expect(target.getOutputScript(0)).toEqual(script);

      // Mutate source and ensure target is unchanged (deep copy)
      source.setOutputAmount(0, 1);
      expect(target.getOutputAmount(0)).toBe(100000);
    });

    it("should throw when deserializing buffer with invalid magic bytes", () => {
      const psbtv2 = new PsbtV2();

      const invalid = Buffer.alloc(5, 0);

      expect(() => psbtv2.deserialize(invalid)).toThrow("Invalid magic bytes");
    });

    it("should delete only matching input entries and preserve others", () => {
      const psbtv2 = new PsbtV2();

      // Add multiple different entry types to input 0
      const pubkey1 = Buffer.alloc(32, 1);
      const pubkey2 = Buffer.alloc(33, 2);
      const hashes = [Buffer.alloc(32, 3)];
      const masterFingerprint = Buffer.from("01020304", "hex");
      const path = [0x8000002c, 0x80000001, 0x80000000, 0, 0];

      // Set TAP_BIP32_DERIVATION (will be deleted)
      psbtv2.setInputTapBip32Derivation(0, pubkey1, hashes, masterFingerprint, path);

      // Set BIP32_DERIVATION (will be preserved)
      psbtv2.setInputBip32Derivation(0, pubkey2, masterFingerprint, path);

      // Set TAP_KEY_SIG (will be deleted)
      psbtv2.setInputTapKeySig(0, Buffer.from("aa", "hex"));

      // Verify both entries exist before deletion
      expect(() => psbtv2.getInputTapBip32Derivation(0, pubkey1)).not.toThrow();
      expect(() => psbtv2.getInputBip32Derivation(0, pubkey2)).not.toThrow();
      expect(psbtv2.getInputTapKeySig(0)).toBeDefined();

      // Delete only TAP-related entries
      psbtv2.deleteInputEntries(0, [psbtIn.TAP_BIP32_DERIVATION, psbtIn.TAP_KEY_SIG]);

      // TAP entries should be gone
      expect(() => psbtv2.getInputTapBip32Derivation(0, pubkey1)).toThrow(NoSuchEntry);
      expect(psbtv2.getInputTapKeySig(0)).toBeUndefined();

      // BIP32_DERIVATION should still exist
      expect(() => psbtv2.getInputBip32Derivation(0, pubkey2)).not.toThrow();
      const deriv = psbtv2.getInputBip32Derivation(0, pubkey2);
      expect(deriv).toBeDefined();
      expect(deriv!.masterFingerprint).toEqual(masterFingerprint);
      expect(deriv!.path).toEqual(path);
    });

    it("should return multiple key datas when multiple entries of same type exist", () => {
      const psbtv2 = new PsbtV2();

      // Add multiple TAP_BIP32_DERIVATION entries with different pubkeys
      const pubkey1 = Buffer.alloc(32, 1);
      const pubkey2 = Buffer.alloc(32, 2);
      const pubkey3 = Buffer.alloc(32, 3);
      const hashes = [Buffer.alloc(32, 4)];
      const masterFingerprint = Buffer.from("0a0b0c0d", "hex");
      const path = [0x8000002c, 0x80000001, 0x80000000, 0, 0];

      psbtv2.setInputTapBip32Derivation(0, pubkey1, hashes, masterFingerprint, path);
      psbtv2.setInputTapBip32Derivation(0, pubkey2, hashes, masterFingerprint, path);
      psbtv2.setInputTapBip32Derivation(0, pubkey3, hashes, masterFingerprint, path);

      // Get all key datas for TAP_BIP32_DERIVATION
      const keyDatas = psbtv2.getInputKeyDatas(0, psbtIn.TAP_BIP32_DERIVATION);

      expect(keyDatas).toHaveLength(3);
      expect(keyDatas).toContainEqual(pubkey1);
      expect(keyDatas).toContainEqual(pubkey2);
      expect(keyDatas).toContainEqual(pubkey3);

      // Verify each one can be retrieved
      expect(() => psbtv2.getInputTapBip32Derivation(0, pubkey1)).not.toThrow();
      expect(() => psbtv2.getInputTapBip32Derivation(0, pubkey2)).not.toThrow();
      expect(() => psbtv2.getInputTapBip32Derivation(0, pubkey3)).not.toThrow();
    });

    it("should return empty array when no keys match the requested type", () => {
      const psbtv2 = new PsbtV2();

      // Set some input data that's not TAP_BIP32_DERIVATION
      const pubkey = Buffer.alloc(33, 1);
      const masterFingerprint = Buffer.from("01020304", "hex");
      const path = [0x8000002c];

      psbtv2.setInputBip32Derivation(0, pubkey, masterFingerprint, path);

      // Try to get TAP_BIP32_DERIVATION keys (should be empty)
      const keyDatas = psbtv2.getInputKeyDatas(0, psbtIn.TAP_BIP32_DERIVATION);

      expect(keyDatas).toHaveLength(0);
    });
  });
});
