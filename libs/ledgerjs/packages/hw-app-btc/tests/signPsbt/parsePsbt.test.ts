import { deserializePsbt } from "../../src/signPsbt/parsePsbt";
import { MerkelizedPsbt } from "../../src/newops/merkelizedPsbt";
import { MerkleMap } from "../../src/newops/merkleMap";
import { PsbtV2 } from "@ledgerhq/psbtv2";
import { Psbt, networks } from "bitcoinjs-lib";

describe("parsePsbt / deserializePsbt", () => {
  describe("PSBT v2", () => {
    it("deserializes a v2 buffer and returns a PsbtV2 that round-trips", () => {
      const psbtv2 = new PsbtV2();
      psbtv2.setGlobalTxVersion(2);
      psbtv2.setGlobalInputCount(0);
      psbtv2.setGlobalOutputCount(0);
      psbtv2.setGlobalPsbtVersion(2);

      const buffer = psbtv2.serialize();
      const result = deserializePsbt(buffer);

      expect(result).toBeInstanceOf(PsbtV2);
      expect(result.serialize()).toEqual(buffer);
      expect(result.getGlobalTxVersion()).toBe(2);
      expect(result.getGlobalInputCount()).toBe(0);
      expect(result.getGlobalOutputCount()).toBe(0);
    });

    it("deserializes a known v2 base64 PSBT unchanged", () => {
      const psbtBuf = Buffer.from(
        "cHNidP8BAAoBAAAAAAAAAAAAAQIEAgAAAAEDBAAAAAABBAECAQUBAgH7BAIAAAAAAQBxAgAAAAGTarLgEHL3k8/kyXdU3hth/gPn22U2yLLyHdC1dCxIRQEAAAAA/v///wLe4ccAAAAAABYAFOt418QL8QY7Dj/OKcNWW2ichVmrECcAAAAAAAAWABQjGNZvhP71xIdfkzsDjcY4MfjaE/mXHgABAR8QJwAAAAAAABYAFCMY1m+E/vXEh1+TOwONxjgx+NoTIgYDRV7nztyXsLpDW4AGb8ksljo0xgAxeYHRNTMMTuQ6x6MY9azC/VQAAIABAACAAAAAgAAAAAABAAAAAQ4gniz+J/Cth7eKI31ddAXUowZmyjYdWFpGew3+QiYrTbQBDwQBAAAAARAE/f///wESBAAAAAAAAQBxAQAAAAEORx706Sway1HvyGYPjT9pk26pybK/9y/5vIHFHvz0ZAEAAAAAAAAAAAJgrgoAAAAAABYAFDXG4N1tPISxa6iF3Kc6yGPQtZPsrwYyAAAAAAAWABTcKG4M0ua9N86+nsNJ+18IkFZy/AAAAAABAR9grgoAAAAAABYAFDXG4N1tPISxa6iF3Kc6yGPQtZPsIgYCcbW3ea2HCDhYd5e89vDHrsWr52pwnXJPSNLibPh08KAY9azC/VQAAIABAACAAAAAgAEAAAAAAAAAAQ4gr7+uBlkPdB/xr1m2rEYRJjNqTEqC21U99v76tzesM/MBDwQAAAAAARAE/f///wESBAAAAAAAIgICKexHcnEx7SWIogxG7amrt9qm9J/VC6/nC5xappYcTswY9azC/VQAAIABAACAAAAAgAEAAAAKAAAAAQMIqDoGAAAAAAABBBYAFOs4+puBKPgfJule2wxf+uqDaQ/kAAEDCOCTBAAAAAAAAQQiACA/qWbJ3c3C/ZbkpeG8dlufr2zos+tPEQSq1r33cyTlvgA=",
        "base64",
      );

      const result = deserializePsbt(psbtBuf);

      expect(result).toBeInstanceOf(PsbtV2);
      expect(result.serialize()).toEqual(psbtBuf);
    });
  });

  describe("PSBT v0", () => {
    it("deserializes a v0 buffer via fromV0 and returns a PsbtV2", () => {
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
      const result = deserializePsbt(buffer);

      expect(result).toBeInstanceOf(PsbtV2);
      expect(result.getGlobalInputCount()).toBe(1);
      expect(result.getGlobalOutputCount()).toBe(1);
    });
  });

  describe("proprietary output fields", () => {
    // BIP-174 proprietary key: type 0xfc, compact-size identifier "hashi", subtype 0x00.
    const PROPRIETARY_KEY = Buffer.from("fc05686173686900", "hex");
    const PROPRIETARY_VALUE = Buffer.from("ab".repeat(32), "hex");
    const PREV_TXID = Buffer.alloc(32, 0x01);
    const INPUT_SCRIPT = Buffer.from("0014" + "00".repeat(20), "hex");
    const P2TR_SCRIPT = Buffer.from("5120" + "22".repeat(32), "hex");
    const CHANGE_SCRIPT = Buffer.from("0014" + "33".repeat(20), "hex");

    // Gives a test access to the output maps, which have no public setter for arbitrary keys.
    class TestPsbtV2 extends PsbtV2 {
      setOutputKeyPair(outputIndex: number, key: Buffer, value: Buffer) {
        this.outputMaps[outputIndex].set(key.toString("hex"), value);
      }
    }

    function buildV0(withField: boolean): Buffer {
      const psbtv0 = new Psbt({ network: networks.testnet });
      psbtv0.setVersion(2);
      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: PREV_TXID,
        index: 0,
        sequence: 0xfffffffd,
        witnessUtxo: { script: INPUT_SCRIPT, value: 200000 },
      });
      psbtv0.addOutput({ script: P2TR_SCRIPT, value: 100000 });
      psbtv0.addOutput({ script: CHANGE_SCRIPT, value: 99500 });
      if (withField) {
        psbtv0.addUnknownKeyValToOutput(0, { key: PROPRIETARY_KEY, value: PROPRIETARY_VALUE });
      }
      return psbtv0.toBuffer();
    }

    function buildV2(withField: boolean): Buffer {
      const psbtv2 = new TestPsbtV2();
      psbtv2.setGlobalTxVersion(2);
      psbtv2.setGlobalFallbackLocktime(0);
      psbtv2.setGlobalInputCount(1);
      psbtv2.setGlobalOutputCount(2);
      psbtv2.setGlobalPsbtVersion(2);
      psbtv2.setInputPreviousTxId(0, PREV_TXID);
      psbtv2.setInputOutputIndex(0, 0);
      psbtv2.setInputSequence(0, 0xfffffffd);
      const amount = Buffer.alloc(8);
      amount.writeBigUInt64LE(200000n);
      psbtv2.setInputWitnessUtxo(0, amount, INPUT_SCRIPT);
      psbtv2.setOutputAmount(0, 100000);
      psbtv2.setOutputScript(0, P2TR_SCRIPT);
      psbtv2.setOutputAmount(1, 99500);
      psbtv2.setOutputScript(1, CHANGE_SCRIPT);
      if (withField) {
        psbtv2.setOutputKeyPair(0, PROPRIETARY_KEY, PROPRIETARY_VALUE);
      }
      return psbtv2.serialize();
    }

    function committedValue(map: MerkleMap, key: Buffer): Buffer | undefined {
      const index = map.keys.findIndex(k => k.equals(key));
      return index === -1 ? undefined : map.values[index];
    }

    it.each([
      ["v0", buildV0],
      ["v2", buildV2],
    ])("keeps the field of a %s PSBT in the output map committed to the device", (_, build) => {
      const buffer = build(true);
      const merkelized = new MerkelizedPsbt(deserializePsbt(buffer));

      expect(merkelized.getGlobalOutputCount()).toBe(2);
      expect(merkelized.getOutputKeyDatas(0, 0xfc)).toEqual([PROPRIETARY_KEY.subarray(1)]);
      expect(committedValue(merkelized.outputMerkleMaps[0], PROPRIETARY_KEY)).toEqual(
        PROPRIETARY_VALUE,
      );
      // The field stays on its own output.
      expect(committedValue(merkelized.outputMerkleMaps[1], PROPRIETARY_KEY)).toBeUndefined();
      expect(merkelized.getOutputKeyDatas(1, 0xfc)).toEqual([]);
    });

    it("commits the same output maps for the v0 and v2 encodings of the same transaction", () => {
      const fromV0 = new MerkelizedPsbt(deserializePsbt(buildV0(true)));
      const fromV2 = new MerkelizedPsbt(deserializePsbt(buildV2(true)));

      expect(fromV0.outputMapCommitments).toEqual(fromV2.outputMapCommitments);
    });

    it.each([
      ["v0", buildV0],
      ["v2", buildV2],
    ])("changes the output commitment when a %s PSBT carries the field", (_, build) => {
      const withField = new MerkelizedPsbt(deserializePsbt(build(true)));
      const withoutField = new MerkelizedPsbt(deserializePsbt(build(false)));

      expect(withoutField.outputMerkleMaps[0].keys.length).toBe(
        withField.outputMerkleMaps[0].keys.length - 1,
      );
      expect(withField.outputMapCommitments[0]).not.toEqual(withoutField.outputMapCommitments[0]);
      expect(withField.outputMapCommitments[1]).toEqual(withoutField.outputMapCommitments[1]);
    });
  });
});
