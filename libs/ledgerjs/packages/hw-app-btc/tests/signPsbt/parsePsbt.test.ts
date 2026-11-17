import { deserializePsbt } from "../../src/signPsbt/parsePsbt";
import { MerkelizedPsbt } from "../../src/newops/merkelizedPsbt";
import { PsbtV2 } from "@ledgerhq/psbtv2";
import { Psbt, networks } from "bitcoinjs-lib";

// A proprietary (0xFC) output key, as a device app derived from the Bitcoin app reads it
const PROPRIETARY_KEY = Buffer.from("fc05686173686900", "hex");
const PROPRIETARY_VALUE = Buffer.from("ab".repeat(32), "hex");
const P2TR_SCRIPT = Buffer.from("5120" + "22".repeat(32), "hex");

/** Value committed to the device for `key` in the output map of output `index`. */
function committedOutputValue(psbt: PsbtV2, index: number, key: Buffer): Buffer | undefined {
  const outputMap = new MerkelizedPsbt(psbt).outputMerkleMaps[index];
  const position = outputMap.keys.findIndex(k => k.equals(key));
  return position === -1 ? undefined : outputMap.values[position];
}

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

    it("commits a proprietary output field to the device unchanged", () => {
      const psbtv2 = new PsbtV2();
      psbtv2.setGlobalTxVersion(2);
      psbtv2.setGlobalInputCount(0);
      psbtv2.setGlobalOutputCount(1);
      psbtv2.setGlobalPsbtVersion(2);
      psbtv2.setOutputAmount(0, 60000);
      psbtv2.setOutputScript(0, P2TR_SCRIPT);
      psbtv2["outputMaps"][0].set(PROPRIETARY_KEY.toString("hex"), PROPRIETARY_VALUE);

      const result = deserializePsbt(psbtv2.serialize());

      expect(committedOutputValue(result, 0, PROPRIETARY_KEY)).toEqual(PROPRIETARY_VALUE);
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
          value: BigInt(100000),
        },
      });
      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: BigInt(90000),
      });

      const buffer = Buffer.from(psbtv0.toBuffer());
      const result = deserializePsbt(buffer);

      expect(result).toBeInstanceOf(PsbtV2);
      expect(result.getGlobalInputCount()).toBe(1);
      expect(result.getGlobalOutputCount()).toBe(1);
    });

    it("commits a proprietary output field to the device unchanged, on its own output only", () => {
      const psbtv0 = new Psbt({ network: networks.testnet });
      psbtv0.addInput({
        //@ts-expect-error TransactionInput interface is not declared correctly in bip174 lib
        hash: Buffer.alloc(32, 0),
        index: 0,
        witnessUtxo: {
          script: Buffer.from("0014" + "00".repeat(20), "hex"),
          value: BigInt(100000),
        },
      });
      psbtv0.addOutput({ script: P2TR_SCRIPT, value: BigInt(60000) });
      psbtv0.addOutput({
        script: Buffer.from("0014" + "11".repeat(20), "hex"),
        value: BigInt(30000),
      });
      psbtv0.addUnknownKeyValToOutput(0, { key: PROPRIETARY_KEY, value: PROPRIETARY_VALUE });

      const result = deserializePsbt(Buffer.from(psbtv0.toBuffer()));

      expect(committedOutputValue(result, 0, PROPRIETARY_KEY)).toEqual(PROPRIETARY_VALUE);
      expect(committedOutputValue(result, 1, PROPRIETARY_KEY)).toBeUndefined();
    });
  });
});
