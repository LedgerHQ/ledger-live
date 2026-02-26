import {
  getScriptPubKeyFromNonWitnessUtxo,
  getInputScriptPubKey,
  setElementBip32DerivationData,
  fixExistingDerivationFingerprints,
  populateMissingBip32Derivations,
} from "../../src/signPsbt/derivationPopulation";
import { getDerivationAccessors } from "../../src/signPsbt/derivationAccessors";
import { PsbtV2, psbtIn, SCRIPT_CONSTANTS } from "@ledgerhq/psbtv2";
import { HASH_SIZE, OP_EQUALVERIFY, OP_CHECKSIG } from "../../src/constants";
import { p2tr, p2wpkh } from "../../src/newops/accounttype";
import { pubkeyFromXpub } from "../../src/bip32";

const masterFp = Buffer.from([1, 2, 3, 4]);

/** Builds a minimal legacy (non-segwit) tx buffer with given output scripts. */
function makeLegacyNonWitnessUtxo(outputScripts: Buffer[]): Buffer {
  const version = Buffer.from([0x01, 0x00, 0x00, 0x00]);
  const inputCount = Buffer.from([0x01]);
  const prevout = Buffer.concat([Buffer.alloc(32, 0), Buffer.from([0xff, 0xff, 0xff, 0xff])]);
  const scriptSigLen = Buffer.from([0x00]);
  const sequence = Buffer.from([0xff, 0xff, 0xff, 0xff]);
  const input = Buffer.concat([prevout, scriptSigLen, sequence]);
  const outputCount = Buffer.from([outputScripts.length]);
  const outputs = Buffer.concat(
    outputScripts.map(script =>
      Buffer.concat([Buffer.alloc(8, 0), Buffer.from([script.length]), script]),
    ),
  );
  const locktime = Buffer.alloc(4, 0);
  return Buffer.concat([version, inputCount, input, outputCount, outputs, locktime]);
}

function makeP2wpkhScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2WPKH.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2WPKH.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2WPKH.PREFIX[1];
  buf.fill(1, 2);
  return buf;
}

function makeP2pkhScriptPubKey(): Buffer {
  const buf = Buffer.alloc(SCRIPT_CONSTANTS.P2PKH.LENGTH);
  buf[0] = SCRIPT_CONSTANTS.P2PKH.PREFIX[0];
  buf[1] = SCRIPT_CONSTANTS.P2PKH.PREFIX[1];
  buf[2] = HASH_SIZE;
  buf.fill(2, 3, 3 + 20);
  buf[23] = OP_EQUALVERIFY;
  buf[24] = OP_CHECKSIG;
  return buf;
}

describe("derivationPopulation", () => {
  const psbt = {} as unknown as PsbtV2;

  describe("getScriptPubKeyFromNonWitnessUtxo", () => {
    it("returns undefined when input has no non-witness UTXO", () => {
      const psbtNoUtxo = {
        getInputNonWitnessUtxo: () => undefined,
      } as unknown as PsbtV2;
      expect(getScriptPubKeyFromNonWitnessUtxo(psbtNoUtxo, 0)).toBeUndefined();
    });

    it("returns scriptPubKey for the given output index from legacy tx", () => {
      const script0 = makeP2pkhScriptPubKey();
      const script1 = makeP2wpkhScriptPubKey();
      const nonWitnessUtxo = makeLegacyNonWitnessUtxo([script0, script1]);
      const psbtWithUtxo = {
        getInputNonWitnessUtxo: () => nonWitnessUtxo,
        getInputOutputIndex: () => 1,
      } as unknown as PsbtV2;
      const result = getScriptPubKeyFromNonWitnessUtxo(psbtWithUtxo, 0);
      expect(result).toEqual(script1);
    });

    it("returns undefined when output index is not found in tx", () => {
      const script = makeP2wpkhScriptPubKey();
      const nonWitnessUtxo = makeLegacyNonWitnessUtxo([script]);
      const psbtWithUtxo = {
        getInputNonWitnessUtxo: () => nonWitnessUtxo,
        getInputOutputIndex: () => 5,
      } as unknown as PsbtV2;
      const result = getScriptPubKeyFromNonWitnessUtxo(psbtWithUtxo, 0);
      expect(result).toBeUndefined();
    });

    it("returns undefined when non-witness UTXO is malformed", () => {
      const psbtMalformed = {
        getInputNonWitnessUtxo: () => Buffer.from([0x00, 0x01]),
        getInputOutputIndex: () => 0,
      } as unknown as PsbtV2;
      expect(getScriptPubKeyFromNonWitnessUtxo(psbtMalformed, 0)).toBeUndefined();
    });
  });

  describe("getInputScriptPubKey", () => {
    it("returns witness UTXO scriptPubKey when present", () => {
      const script = makeP2wpkhScriptPubKey();
      const psbtWitness = {
        getInputWitnessUtxo: () => ({ scriptPubKey: script }),
      } as unknown as PsbtV2;
      expect(getInputScriptPubKey(psbtWitness, 0)).toEqual(script);
    });

    it("falls back to non-witness UTXO when no witness UTXO", () => {
      const script = makeP2wpkhScriptPubKey();
      const nonWitnessUtxo = makeLegacyNonWitnessUtxo([script]);
      const psbtNonWitness = {
        getInputWitnessUtxo: () => undefined,
        getInputNonWitnessUtxo: () => nonWitnessUtxo,
        getInputOutputIndex: () => 0,
      } as unknown as PsbtV2;
      expect(getInputScriptPubKey(psbtNonWitness, 0)).toEqual(script);
    });
  });

  describe("setElementBip32DerivationData", () => {
    it("calls setBip32Derivation for non-taproot account type (input)", () => {
      const setInputBip32Derivation = jest.fn();
      const psbtMock = {
        getInputKeyDatas: () => [],
        getInputBip32Derivation: () => null,
        getInputTapBip32Derivation: () => null,
        setInputBip32Derivation,
        setInputTapBip32Derivation: jest.fn(),
      } as unknown as PsbtV2;
      const accessors = getDerivationAccessors(psbtMock, "input");
      const pubkey = Buffer.alloc(33, 1);
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const accountType = new p2wpkh(psbtMock, masterFp);
      setElementBip32DerivationData(accessors, 0, pubkey, masterFp, path, accountType);
      expect(setInputBip32Derivation).toHaveBeenCalledWith(0, pubkey, masterFp, path);
    });

    it("calls setTapBip32Derivation for taproot account type (input)", () => {
      const setInputTapBip32Derivation = jest.fn();
      const psbtMock = {
        getInputKeyDatas: () => [],
        getInputBip32Derivation: () => null,
        getInputTapBip32Derivation: () => null,
        setInputBip32Derivation: jest.fn(),
        setInputTapBip32Derivation: setInputTapBip32Derivation,
      } as unknown as PsbtV2;
      const accessors = getDerivationAccessors(psbtMock, "input");
      const pubkey = Buffer.alloc(33, 1);
      const path = [0x80000056, 0x80000000, 0x80000000, 0, 0];
      const accountType = new p2tr(psbtMock, masterFp);
      setElementBip32DerivationData(accessors, 0, pubkey, masterFp, path, accountType);
      expect(setInputTapBip32Derivation).toHaveBeenCalledWith(
        0,
        pubkey.subarray(1),
        [],
        masterFp,
        path,
      );
    });

    it("calls setBip32Derivation for non-taproot account type (output)", () => {
      const setOutputBip32Derivation = jest.fn();
      const psbtMock = {
        getOutputKeyDatas: () => [],
        getOutputBip32Derivation: () => null,
        getOutputTapBip32Derivation: () => null,
        setOutputBip32Derivation: setOutputBip32Derivation,
        setOutputTapBip32Derivation: jest.fn(),
      } as unknown as PsbtV2;
      const accessors = getDerivationAccessors(psbtMock, "output");
      const pubkey = Buffer.alloc(33, 1);
      const path = [0x80000054, 0x80000000, 0x80000000, 1, 0];
      const accountType = new p2wpkh(psbtMock, masterFp);
      setElementBip32DerivationData(accessors, 0, pubkey, masterFp, path, accountType);
      expect(setOutputBip32Derivation).toHaveBeenCalledWith(0, pubkey, masterFp, path);
    });

    it("calls setTapBip32Derivation for taproot account type (output)", () => {
      const setOutputTapBip32Derivation = jest.fn();
      const psbtMock = {
        getOutputKeyDatas: () => [],
        getOutputBip32Derivation: () => null,
        getOutputTapBip32Derivation: () => null,
        setOutputBip32Derivation: jest.fn(),
        setOutputTapBip32Derivation: setOutputTapBip32Derivation,
      } as unknown as PsbtV2;
      const accessors = getDerivationAccessors(psbtMock, "output");
      const pubkey = Buffer.alloc(33, 1);
      const path = [0x80000056, 0x80000000, 0x80000000, 1, 0];
      const accountType = new p2tr(psbtMock, masterFp);
      setElementBip32DerivationData(accessors, 0, pubkey, masterFp, path, accountType);
      expect(setOutputTapBip32Derivation).toHaveBeenCalledWith(
        0,
        pubkey.subarray(1),
        [],
        masterFp,
        path,
      );
    });
  });

  describe("fixExistingDerivationFingerprints", () => {
    it("returns true and updates derivation when pubkey matches device xpub", async () => {
      const path = [0x80000054, 0x80000000, 0x80000000, 0, 0];
      const xpub =
        "tpubDCwYjpDhUdPGP5rS3wgNg13mTrrjBuG8V9VpWbyptX6TRPbNoZVXsoVUSkCjmQ8jJycjuDKBb9eataSymXakTTaGifxR6kmVsfFehH1ZgJT";
      const derivedPubkey = pubkeyFromXpub(xpub);
      const wrongFp = Buffer.from([0xaa, 0xbb, 0xcc, 0xdd]);
      const setInputBip32Derivation = jest.fn();
      const client = {
        getExtendedPubkey: async () => xpub,
      };
      const psbtMock = {
        getInputKeyDatas: (_i: number, kt: number) =>
          kt === psbtIn.BIP32_DERIVATION ? [derivedPubkey] : [],
        getInputBip32Derivation: () => ({ path, masterFingerprint: wrongFp }),
        getInputTapBip32Derivation: () => null,
        setInputBip32Derivation: setInputBip32Derivation,
        setInputTapBip32Derivation: jest.fn(),
      } as unknown as PsbtV2;
      const result = await fixExistingDerivationFingerprints(
        client as any,
        psbtMock,
        0,
        masterFp,
        "input",
      );
      expect(result).toBe(true);
      expect(setInputBip32Derivation).toHaveBeenCalledWith(0, derivedPubkey, masterFp, path);
    });

    it("returns false when no derivation can be fixed", async () => {
      const psbtMock = {
        getInputKeyDatas: () => [],
        getInputBip32Derivation: () => null,
        getInputTapBip32Derivation: () => null,
        setInputBip32Derivation: jest.fn(),
        setInputTapBip32Derivation: jest.fn(),
      } as unknown as PsbtV2;
      const client = { getExtendedPubkey: async () => "" };
      const result = await fixExistingDerivationFingerprints(
        client as any,
        psbtMock,
        0,
        masterFp,
        "input",
      );
      expect(result).toBe(false);
    });
  });

  describe("populateMissingBip32Derivations", () => {
    it("returns early when account path is empty", async () => {
      const getExtendedPubkey = jest.fn();
      const client = { getExtendedPubkey };
      const psbtMock = {
        getGlobalInputCount: () => 0,
        getGlobalOutputCount: () => 0,
        getInputKeyDatas: () => [],
        getInputBip32Derivation: () => null,
        getInputTapBip32Derivation: () => null,
        getOutputKeyDatas: () => [],
        getOutputBip32Derivation: () => null,
        getOutputTapBip32Derivation: () => null,
      } as unknown as PsbtV2;
      await populateMissingBip32Derivations(client as any, psbtMock, 0, masterFp, [], new Map());
      expect(getExtendedPubkey).not.toHaveBeenCalled();
    });
  });
});
