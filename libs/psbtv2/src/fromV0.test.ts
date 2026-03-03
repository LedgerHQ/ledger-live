import { Psbt, payments, ECPair, networks } from "bitcoinjs-lib";
import { PsbtV2 } from "./psbtv2";

describe("PsbtV2.fromV0", () => {
  describe("Basic Conversion", () => {
    it("should convert a simple PSBTv0 with one P2WPKH input and output", () => {
      // Create a PSBTv0
      const psbtv0 = new Psbt({ network: networks.testnet });

      // Add input
      const prevTxId = Buffer.from(
        "0000000000000000000000000000000000000000000000000000000000000001",
        "hex",
      );
      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: prevTxId,
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 100000,
        },
        sequence: 0xfffffffd,
      });

      // Add output
      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      // Convert to PSBTv2
      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      // Verify global fields
      expect(psbtv2.getGlobalTxVersion()).toBe(2);
      expect(psbtv2.getGlobalFallbackLocktime()).toBe(0);
      expect(psbtv2.getGlobalInputCount()).toBe(1);
      expect(psbtv2.getGlobalOutputCount()).toBe(1);
      expect(psbtv2.getGlobalPsbtVersion()).toBe(2);

      // Verify input fields
      expect(psbtv2.getInputPreviousTxid(0)).toEqual(prevTxId);
      expect(psbtv2.getInputOutputIndex(0)).toBe(0);
      expect(psbtv2.getInputSequence(0)).toBe(0xfffffffd);

      const witnessUtxo = psbtv2.getInputWitnessUtxo(0);
      expect(witnessUtxo).toBeDefined();
      expect(witnessUtxo!.scriptPubKey.toString("hex")).toBe("0014" + "00".repeat(20));

      // Verify output fields
      expect(psbtv2.getOutputAmount(0)).toBe(90000);
      expect(psbtv2.getOutputScript(0).toString("hex")).toBe("0014" + "11".repeat(20));
    });

    it("should convert a PSBTv0 with custom locktime", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });
      psbtv0.setLocktime(500000);

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

      expect(psbtv2.getGlobalFallbackLocktime()).toBe(500000);
    });

    it("should throw error for transaction version 1 when not allowed", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });
      psbtv0.setVersion(1);

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

      expect(() => PsbtV2.fromV0(psbtv0.toBuffer())).toThrow(
        /Transaction version 1 detected.*allowTxnVersion1=true/,
      );
    });

    it("should accept Buffer input", () => {
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
      const psbtv2 = PsbtV2.fromV0(buffer, true);

      expect(psbtv2.getGlobalInputCount()).toBe(1);
      expect(psbtv2.getGlobalOutputCount()).toBe(1);
    });
  });

  describe("Multiple Inputs and Outputs", () => {
    it("should handle multiple inputs", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      // Add 3 inputs
      for (let i = 0; i < 3; i++) {
        psbtv0.addInput({
          //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
          hash: Buffer.alloc(32, i),
          index: i,
          witnessUtxo: {
            script: Buffer.from("0014" + "00".repeat(20), "hex"),
            value: 100000 + i * 10000,
          },
          sequence: 0xffffffff - i,
        });
      }

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 300000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      expect(psbtv2.getGlobalInputCount()).toBe(3);

      for (let i = 0; i < 3; i++) {
        expect(psbtv2.getInputOutputIndex(i)).toBe(i);
        expect(psbtv2.getInputSequence(i)).toBe(0xffffffff - i);
        const utxo = psbtv2.getInputWitnessUtxo(i);
        expect(utxo).toBeDefined();
      }
    });

    it("should handle multiple outputs", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 500000,
        },
      });

      // Add 3 outputs
      for (let i = 0; i < 3; i++) {
        psbtv0.addOutput({
          script: Buffer.from("0014" + Buffer.alloc(20, i).toString("hex"), "hex"),
          value: 100000 + i * 10000,
        });
      }

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      expect(psbtv2.getGlobalOutputCount()).toBe(3);

      for (let i = 0; i < 3; i++) {
        expect(psbtv2.getOutputAmount(i)).toBe(100000 + i * 10000);
      }
    });
  });

  describe("UTXO Types", () => {
    it("should handle witnessUtxo", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      const script = Buffer.from("0014" + "aa".repeat(20), "hex");
      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script,
          value: 123456,
        },
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 100000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const witnessUtxo = psbtv2.getInputWitnessUtxo(0);
      expect(witnessUtxo).toBeDefined();
      expect(witnessUtxo!.scriptPubKey).toEqual(script);
    });

    it("should handle nonWitnessUtxo", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      // Create a dummy previous transaction
      const prevTx = Buffer.from(
        "0200000001" + // version
          "00".repeat(32) + // prev txid
          "00000000" + // prev vout
          "00" + // scriptSig length
          "ffffffff" + // sequence
          "01" + // output count
          "a086010000000000" + // value (100000)
          "16" + // script length
          "0014" +
          "00".repeat(20) + // script
          "00000000", // locktime
        "hex",
      );

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 1),
        index: 0,
        nonWitnessUtxo: prevTx,
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const nonWitnessUtxo = psbtv2.getInputNonWitnessUtxo(0);
      expect(nonWitnessUtxo).toBeDefined();
      expect(nonWitnessUtxo).toEqual(prevTx);
    });
  });

  describe("Optional Fields", () => {
    it("should handle redeemScript for P2SH", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      const redeemScript = Buffer.from("0014" + "00".repeat(20), "hex");

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("a914" + "00".repeat(20) + "87", "hex"), // P2SH
          value: 100000,
        },
        redeemScript,
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const convertedRedeemScript = psbtv2.getInputRedeemScript(0);
      expect(convertedRedeemScript).toBeDefined();
      expect(convertedRedeemScript).toEqual(redeemScript);
    });

    it("should handle sighashType", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 100000,
        },
        sighashType: 0x03, // SIGHASH_SINGLE
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const sighashType = psbtv2.getInputSighashType(0);
      expect(sighashType).toBe(0x03);
    });

    it("should handle BIP32 derivation paths on inputs", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      const pubkey = Buffer.from("02" + "00".repeat(32), "hex");
      const masterFingerprint = Buffer.from("12345678", "hex");

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 100000,
        },
        bip32Derivation: [
          {
            masterFingerprint,
            pubkey,
            path: "m/84'/1'/0'/0/0",
          },
        ],
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const deriv = psbtv2.getInputBip32Derivation(0, pubkey);
      expect(deriv).toBeDefined();
      expect(deriv!.masterFingerprint).toEqual(masterFingerprint);
      expect(deriv!.path).toEqual([
        0x80000054, // 84'
        0x80000001, // 1'
        0x80000000, // 0'
        0, // 0
        0, // 0
      ]);
    });

    it("should handle BIP32 derivation paths on outputs", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      const pubkey = Buffer.from("02" + "00".repeat(32), "hex");
      const masterFingerprint = Buffer.from("87654321", "hex");

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
        bip32Derivation: [
          {
            masterFingerprint,
            pubkey,
            path: "m/84'/1'/0'/1/0",
          },
        ],
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const deriv = psbtv2.getOutputBip32Derivation(0, pubkey);
      expect(deriv).toBeDefined();
      expect(deriv.masterFingerprint).toEqual(masterFingerprint);
      expect(deriv.path).toEqual([
        0x80000054, // 84'
        0x80000001, // 1'
        0x80000000, // 0'
        1, // 1
        0, // 0
      ]);
    });

    it("should handle redeemScript on outputs", () => {
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

      const redeemScript = Buffer.from("0014" + "22".repeat(20), "hex");

      psbtv0.addOutput({
        script: Buffer.from("a914" + "11".repeat(20) + "87", "hex"),
        value: 90000,
        redeemScript,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const outRedeemScript = psbtv2.getOutputRedeemScript(0);
      expect(outRedeemScript).toEqual(redeemScript);
    });
  });

  describe("Partial Signatures", () => {
    it("should transfer partial signatures", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      // Create a real keypair for signing
      const keyPair = ECPair.makeRandom({ network: networks.testnet });
      const pubkey = keyPair.publicKey;
      const p2wpkh = payments.p2wpkh({ pubkey, network: networks.testnet });

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: p2wpkh.output!,
          value: 100000,
        },
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      // Actually sign the input
      psbtv0.signInput(0, keyPair);

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      // Verify the signature was transferred
      const partialSig = psbtv2.getInputPartialSig(0, pubkey);
      expect(partialSig).toBeDefined();
      expect(partialSig!.length).toBeGreaterThan(0);
    });
  });

  describe("Finalized Inputs", () => {
    it("should transfer finalScriptSig", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      const finalScriptSig = Buffer.from("47" + "00".repeat(71) + "21" + "00".repeat(33), "hex");

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        nonWitnessUtxo: Buffer.from(
          "0200000001" +
            "00".repeat(32) +
            "00000000" +
            "00" +
            "ffffffff" +
            "01" +
            "a086010000000000" +
            "16" +
            "0014" +
            "00".repeat(20) +
            "00000000",
          "hex",
        ),
        finalScriptSig,
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const scriptSig = psbtv2.getInputFinalScriptsig(0);
      expect(scriptSig).toBeDefined();
      expect(scriptSig).toEqual(finalScriptSig);
    });

    it("should transfer finalScriptWitness", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      const finalScriptWitness = Buffer.from(
        "02" + // 2 witness items
          "47" +
          "00".repeat(71) + // signature
          "21" +
          "00".repeat(33), // pubkey
        "hex",
      );

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: 100000,
        },
        finalScriptWitness,
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: 90000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      const scriptWitness = psbtv2.getInputFinalScriptwitness(0);
      expect(scriptWitness).toBeDefined();
      expect(scriptWitness).toEqual(finalScriptWitness);
    });
  });

  describe("Roundtrip Compatibility", () => {
    it("should preserve data through serialize/deserialize after conversion", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });

      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.from(
          "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
          "hex",
        ),
        index: 7,
        witnessUtxo: {
          script: Buffer.from("0014" + "cc".repeat(20), "hex"),
          value: 250000,
        },
        sequence: 0xfffffffe,
      });

      psbtv0.addOutput({
        script: Buffer.from("0014" + "dd".repeat(20), "hex"),
        value: 240000,
      });

      const psbtv2 = PsbtV2.fromV0(psbtv0.toBuffer(), true);

      // Serialize and deserialize
      const serialized = psbtv2.serialize();
      const psbtv2Copy = new PsbtV2();
      psbtv2Copy.deserialize(serialized);

      // Verify data is preserved
      expect(psbtv2Copy.getGlobalInputCount()).toBe(1);
      expect(psbtv2Copy.getGlobalOutputCount()).toBe(1);
      expect(psbtv2Copy.getInputOutputIndex(0)).toBe(7);
      expect(psbtv2Copy.getInputSequence(0)).toBe(0xfffffffe);
      expect(psbtv2Copy.getOutputAmount(0)).toBe(240000);
    });
  });
});
