import { BufferReader, PsbtV2, extractHashFromScriptPubKey } from "@ledgerhq/psbtv2";
import { pubkeyFromXpub } from "../bip32";
import type { AccountType } from "../newops/accounttype";
import { p2tr } from "../newops/accounttype";
import type { DerivationAccessors, DerivationElementType } from "./types";
import {
  getDerivationAccessors,
  checkBip32Derivation,
  checkOutputBip32Derivation,
} from "./derivationAccessors";
import {
  createAccountTypeFromScriptType,
  determineAccountTypeFromPurpose,
} from "./accountTypeResolver";

export type SignPsbtClient = {
  getExtendedPubkey(display: boolean, pathElements: number[]): Promise<string>;
};

/**
 * Extracts the scriptPubKey from a non-witness UTXO by parsing the previous transaction.
 */
export function getScriptPubKeyFromNonWitnessUtxo(
  psbt: PsbtV2,
  inputIndex: number,
): Buffer | undefined {
  const nonWitnessUtxo = psbt.getInputNonWitnessUtxo(inputIndex);
  if (!nonWitnessUtxo) {
    return undefined;
  }

  try {
    const outputIndex = psbt.getInputOutputIndex(inputIndex);
    const reader = new BufferReader(nonWitnessUtxo);

    reader.readSlice(4);

    const marker = reader.readUInt8();
    if (marker === 0) {
      const flag = reader.readUInt8();
      if (flag === 0) {
        return undefined;
      }
    } else {
      reader.offset -= 1;
    }

    const inputCount = reader.readVarInt();
    for (let i = 0; i < inputCount; i++) {
      reader.readSlice(32);
      reader.readSlice(4);
      const scriptLen = reader.readVarInt();
      reader.readSlice(scriptLen);
      reader.readSlice(4);
    }

    const outputCount = reader.readVarInt();
    for (let i = 0; i < outputCount; i++) {
      reader.readSlice(8);
      const scriptLen = reader.readVarInt();
      const scriptPubKey = reader.readSlice(scriptLen);
      if (i === outputIndex) {
        return scriptPubKey;
      }
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Extracts the scriptPubKey from an input's UTXO data.
 */
export function getInputScriptPubKey(psbt: PsbtV2, inputIndex: number): Buffer | undefined {
  const witnessUtxo = psbt.getInputWitnessUtxo(inputIndex);
  if (witnessUtxo) {
    return witnessUtxo.scriptPubKey;
  }
  return getScriptPubKeyFromNonWitnessUtxo(psbt, inputIndex);
}

/**
 * Generic method to fix BIP32 derivations with wrong master fingerprint.
 */
export async function fixDerivationFingerprints(
  client: SignPsbtClient,
  accessors: DerivationAccessors,
  elementIndex: number,
  masterFp: Buffer,
): Promise<boolean> {
  const keyDatas = accessors.getKeyDatas(elementIndex, accessors.bip32KeyType);

  for (const existingPubkey of keyDatas) {
    const derivationInfo = accessors.getBip32Derivation(elementIndex, existingPubkey);
    if (!derivationInfo) continue;

    if (derivationInfo.masterFingerprint.equals(masterFp)) continue;

    const path = derivationInfo.path;
    const xpub = await client.getExtendedPubkey(false, path);
    const derivedPubkey = pubkeyFromXpub(xpub);

    if (existingPubkey.equals(derivedPubkey)) {
      accessors.setBip32Derivation(elementIndex, existingPubkey, masterFp, path);
      return true;
    }
  }

  const tapKeyDatas = accessors.getKeyDatas(elementIndex, accessors.tapBip32KeyType);
  for (const existingPubkey of tapKeyDatas) {
    const derivationInfo = accessors.getTapBip32Derivation(elementIndex, existingPubkey);
    if (!derivationInfo || derivationInfo.masterFingerprint.equals(masterFp)) continue;

    const path = derivationInfo.path;
    const xpub = await client.getExtendedPubkey(false, path);
    const derivedPubkey = pubkeyFromXpub(xpub);
    const xonlyDerived = derivedPubkey.subarray(1);

    if (existingPubkey.equals(xonlyDerived)) {
      accessors.setTapBip32Derivation(
        elementIndex,
        existingPubkey,
        derivationInfo.hashes,
        masterFp,
        path,
      );
      return true;
    }
  }

  return false;
}

export async function fixExistingDerivationFingerprints(
  client: SignPsbtClient,
  psbt: PsbtV2,
  elementIndex: number,
  masterFp: Buffer,
  elementType: DerivationElementType,
): Promise<boolean> {
  const accessors = getDerivationAccessors(psbt, elementType);
  return fixDerivationFingerprints(client, accessors, elementIndex, masterFp);
}

/**
 * Generic method to set BIP32 derivation data on an input or output.
 */
export function setElementBip32DerivationData(
  accessors: DerivationAccessors,
  elementIndex: number,
  pubkey: Buffer,
  masterFp: Buffer,
  path: number[],
  accountType: AccountType,
): void {
  if (accountType instanceof p2tr) {
    const xonlyPubkey = pubkey.subarray(1);
    accessors.setTapBip32Derivation(elementIndex, xonlyPubkey, [], masterFp, path);
  } else {
    accessors.setBip32Derivation(elementIndex, pubkey, masterFp, path);
  }
}

async function collectElementsNeedingLocalScan(
  client: SignPsbtClient,
  psbt: PsbtV2,
  count: number,
  masterFp: Buffer,
  elementType: DerivationElementType,
  hasDerivation: (index: number) => boolean,
): Promise<number[]> {
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    if (hasDerivation(i)) continue;
    const fixed = await fixExistingDerivationFingerprints(client, psbt, i, masterFp, elementType);
    if (!fixed) indices.push(i);
  }
  return indices;
}

function applyLookupToElements(
  psbt: PsbtV2,
  indices: number[],
  lookupMap: Map<string, { pubkey: Buffer; path: number[] }>,
  masterFp: Buffer,
  elementType: DerivationElementType,
  getScriptPubKey: (index: number) => Buffer | undefined,
): void {
  const accessors = getDerivationAccessors(psbt, elementType);
  for (const elementIndex of indices) {
    const scriptPubKey = getScriptPubKey(elementIndex);
    if (!scriptPubKey) continue;
    const extracted = extractHashFromScriptPubKey(scriptPubKey);
    if (!extracted) continue;
    const result = lookupMap.get(extracted.hashHex);
    if (result) {
      const accountType = createAccountTypeFromScriptType(extracted.scriptType, psbt, masterFp);
      setElementBip32DerivationData(
        accessors,
        elementIndex,
        result.pubkey,
        masterFp,
        result.path,
        accountType,
      );
    }
  }
}

/**
 * Populates missing BIP32 derivations using the provided known-address map.
 * The map must be built by the caller from the wallet's known addresses (e.g. receive/change).
 */
export async function populateMissingBip32Derivations(
  client: SignPsbtClient,
  psbt: PsbtV2,
  inputCount: number,
  masterFp: Buffer,
  accountPath: number[],
  knownAddressDerivations: Map<string, { pubkey: Buffer; path: number[] }>,
): Promise<void> {
  const accountType = determineAccountTypeFromPurpose(accountPath, psbt, masterFp);
  if (!accountType) return;

  const outputCount = psbt.getGlobalOutputCount();
  const [inputsNeedingLocalScan, outputsNeedingLocalScan] = await Promise.all([
    collectElementsNeedingLocalScan(
      client,
      psbt,
      inputCount,
      masterFp,
      "input",
      i => checkBip32Derivation(psbt, i, masterFp).belongsToSigner,
    ),
    collectElementsNeedingLocalScan(client, psbt, outputCount, masterFp, "output", i =>
      checkOutputBip32Derivation(psbt, i, masterFp),
    ),
  ]);

  if (inputsNeedingLocalScan.length === 0 && outputsNeedingLocalScan.length === 0) return;
  if (knownAddressDerivations.size === 0) return;

  applyLookupToElements(
    psbt,
    inputsNeedingLocalScan,
    knownAddressDerivations,
    masterFp,
    "input",
    i => getInputScriptPubKey(psbt, i),
  );
  applyLookupToElements(
    psbt,
    outputsNeedingLocalScan,
    knownAddressDerivations,
    masterFp,
    "output",
    i => psbt.getOutputScript(i),
  );
}
