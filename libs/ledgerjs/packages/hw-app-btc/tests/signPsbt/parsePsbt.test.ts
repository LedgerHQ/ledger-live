import { deserializePsbt } from "../../src/signPsbt/parsePsbt";
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
});
