import { BufferReader, PsbtV2 } from "@ledgerhq/psbtv2";
import { deriveChildPublicKey, getXpubComponents, pubkeyFromXpub } from "../bip32";
import type { AccountType } from "../newops/accounttype";
import { p2tr } from "../newops/accounttype";
import type { DerivationAccessors, DerivationElementType } from "./types";
import {
  getDerivationAccessors,
  checkBip32Derivation,
  checkOutputBip32Derivation,
} from "./derivationAccessors";
import { determineAccountTypeFromPurpose } from "./accountTypeResolver";

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
 * Builds a pre-computed lookup map from scriptPubKey hex to { pubkey, path }.
 */
export function buildScriptPubKeyLookupMap(
  accountPubkey: Buffer,
  accountChaincode: Buffer,
  accountPath: number[],
  accountType: AccountType,
  addressScanLimit?: number,
): Map<string, { pubkey: Buffer; path: number[] }> {
  const scanLimit = addressScanLimit ?? 20;
  const lookupMap = new Map<string, { pubkey: Buffer; path: number[] }>();

  for (const change of [0, 1]) {
    let changeKey: { pubkey: Buffer; chaincode: Buffer };
    try {
      changeKey = deriveChildPublicKey(accountPubkey, accountChaincode, change);
    } catch {
      continue;
    }

    for (let index = 0; index < scanLimit; index++) {
      let pubkey: Buffer;
      try {
        ({ pubkey } = deriveChildPublicKey(changeKey.pubkey, changeKey.chaincode, index));
      } catch {
        continue;
      }
      const cond = accountType.spendingCondition([pubkey]);
      lookupMap.set(cond.scriptPubKey.toString("hex"), {
        pubkey,
        path: [...accountPath, change, index],
      });
    }
  }
  return lookupMap;
}

/**
 * Generic method to fix BIP32 derivations with wrong master fingerprint.
 */
export async function fixDerivationFingerprints(
  client: SignPsbtClient,
  accessors: DerivationAccessors,
  elementIndex: number,
  masterFp: Buffer,
  elementType: "input" | "output" = "input",
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
      console.debug(
        `[BtcNew] Fixed BIP32 derivation fingerprint for ${elementType} ${elementIndex}`,
      );
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
      console.debug(
        `[BtcNew] Fixed TAP_BIP32 derivation fingerprint for ${elementType} ${elementIndex}`,
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
  return fixDerivationFingerprints(client, accessors, elementIndex, masterFp, elementType);
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

export function setInputBip32DerivationData(
  psbt: PsbtV2,
  inputIndex: number,
  pubkey: Buffer,
  masterFp: Buffer,
  path: number[],
  accountType: AccountType,
): void {
  const accessors = getDerivationAccessors(psbt, "input");
  setElementBip32DerivationData(accessors, inputIndex, pubkey, masterFp, path, accountType);
}

export function setOutputBip32DerivationData(
  psbt: PsbtV2,
  outputIndex: number,
  pubkey: Buffer,
  masterFp: Buffer,
  path: number[],
  accountType: AccountType,
): void {
  const accessors = getDerivationAccessors(psbt, "output");
  setElementBip32DerivationData(accessors, outputIndex, pubkey, masterFp, path, accountType);
}

/**
 * Populates missing BIP32 derivations using a two-phase approach.
 */
export async function populateMissingBip32Derivations(
  client: SignPsbtClient,
  psbt: PsbtV2,
  inputCount: number,
  masterFp: Buffer,
  accountPath: number[],
  addressScanLimit?: number,
): Promise<void> {
  const accountType = determineAccountTypeFromPurpose(accountPath, psbt, masterFp);
  if (!accountType) return;

  const inputsNeedingLocalScan: number[] = [];

  for (let i = 0; i < inputCount; i++) {
    const derivation = checkBip32Derivation(psbt, i, masterFp);
    if (derivation.isInternal) continue;

    const fixed = await fixExistingDerivationFingerprints(client, psbt, i, masterFp, "input");
    if (!fixed) {
      inputsNeedingLocalScan.push(i);
    }
  }

  const outputCount = psbt.getGlobalOutputCount();
  const outputsNeedingLocalScan: number[] = [];

  for (let i = 0; i < outputCount; i++) {
    if (checkOutputBip32Derivation(psbt, i, masterFp)) continue;

    const fixed = await fixExistingDerivationFingerprints(client, psbt, i, masterFp, "output");
    if (!fixed) {
      outputsNeedingLocalScan.push(i);
    }
  }

  const needsLocalScan = inputsNeedingLocalScan.length > 0 || outputsNeedingLocalScan.length > 0;

  if (needsLocalScan) {
    const accountXpub = await client.getExtendedPubkey(false, accountPath);
    const { pubkey: accountPubkey, chaincode: accountChaincode } = getXpubComponents(accountXpub);

    const lookupMap = buildScriptPubKeyLookupMap(
      accountPubkey,
      accountChaincode,
      accountPath,
      accountType,
      addressScanLimit,
    );

    for (const inputIndex of inputsNeedingLocalScan) {
      const scriptPubKey = getInputScriptPubKey(psbt, inputIndex);
      if (!scriptPubKey) continue;

      const result = lookupMap.get(scriptPubKey.toString("hex"));
      if (result) {
        setInputBip32DerivationData(
          psbt,
          inputIndex,
          result.pubkey,
          masterFp,
          result.path,
          accountType,
        );
      }
    }

    for (const outputIndex of outputsNeedingLocalScan) {
      const scriptPubKey = psbt.getOutputScript(outputIndex);
      const result = lookupMap.get(scriptPubKey.toString("hex"));
      if (result) {
        setOutputBip32DerivationData(
          psbt,
          outputIndex,
          result.pubkey,
          masterFp,
          result.path,
          accountType,
        );
      }
    }
  }
}
