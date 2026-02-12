import { PsbtV2 } from "@ledgerhq/psbtv2";
import { pathArrayToString, pathStringToArray } from "../bip32";
import { checkBip32Derivation } from "./derivationAccessors";
import { detectScriptType } from "./accountTypeResolver";
import type { ScriptType } from "./types";

export function arePathsEqual(path1: number[], path2: number[]): boolean {
  if (path1.length !== path2.length) return false;
  return path1.every((elem, idx) => elem === path2[idx]);
}

export function validateAccountPathConsistency(
  accountPath: number[],
  newAccountPath: number[],
  inputIndex: number,
): void {
  if (accountPath.length > 0 && !arePathsEqual(accountPath, newAccountPath)) {
    throw new Error(
      `Mixed accounts detected in PSBT. Input ${inputIndex} uses account path ` +
        `${pathArrayToString(newAccountPath)} but expected ` +
        `${pathArrayToString(accountPath)}. All internal inputs must belong to the same account.`,
    );
  }
}

export function validateScriptTypeConsistency(
  detectedScriptType: ScriptType | undefined,
  newScriptType: ScriptType | undefined,
  inputIndex: number,
): void {
  if (detectedScriptType && newScriptType && detectedScriptType !== newScriptType) {
    throw new Error(
      `Mixed input types detected in PSBT. Input ${inputIndex} uses ${newScriptType} ` +
        `but expected ${detectedScriptType}. All internal inputs must use the same script type.`,
    );
  }
}

export function resolveAccountPathFromOptions(accountPathOption?: string): number[] {
  if (!accountPathOption) {
    throw new Error(
      "No internal inputs found in PSBT (no BIP32 derivation matching device fingerprint) " +
        "and no account path provided in options. Please provide accountPath in options " +
        "(e.g., \"m/84'/0'/0'\" for native segwit)",
    );
  }
  return pathStringToArray(accountPathOption);
}

/**
 * Determines the script type for a single input from witness UTXO or redeem script.
 */
export function determineInputScriptType(psbt: PsbtV2, inputIndex: number): ScriptType | undefined {
  const witnessUtxo = psbt.getInputWitnessUtxo(inputIndex);
  if (witnessUtxo) {
    return detectScriptType(witnessUtxo.scriptPubKey);
  }

  const redeemScript = psbt.getInputRedeemScript(inputIndex);
  if (redeemScript) {
    return "p2sh-p2wpkh";
  }

  return undefined;
}

/**
 * Analyzes a single input to determine if it's internal and extracts account path and script type.
 */
export function analyzeInput(
  psbt: PsbtV2,
  inputIndex: number,
  masterFp: Buffer,
): {
  isInternal: boolean;
  accountPath: number[];
  scriptType: ScriptType | undefined;
} {
  const derivationResult = checkBip32Derivation(psbt, inputIndex, masterFp);
  const scriptType = determineInputScriptType(psbt, inputIndex);

  return {
    isInternal: derivationResult.isInternal,
    accountPath: derivationResult.accountPath,
    scriptType,
  };
}

/**
 * Analyzes all inputs and returns resolved account path, detected script type, and internal input indices.
 */
export function analyzeAllInputs(
  psbt: PsbtV2,
  inputCount: number,
  masterFp: Buffer,
  accountPathOption?: string,
): {
  accountPath: number[];
  detectedScriptType: ScriptType | undefined;
  internalInputIndices: number[];
} {
  const internalInputIndices: number[] = [];
  let accountPath: number[] = [];
  let detectedScriptType: ScriptType | undefined;

  for (let i = 0; i < inputCount; i++) {
    const inputInfo = analyzeInput(psbt, i, masterFp);

    if (!inputInfo.isInternal) {
      continue;
    }

    internalInputIndices.push(i);
    validateAccountPathConsistency(accountPath, inputInfo.accountPath, i);

    if (accountPath.length === 0) {
      accountPath = inputInfo.accountPath;
    }

    validateScriptTypeConsistency(detectedScriptType, inputInfo.scriptType, i);

    if (!detectedScriptType) {
      detectedScriptType = inputInfo.scriptType;
    }
  }

  if (internalInputIndices.length === 0) {
    accountPath = resolveAccountPathFromOptions(accountPathOption);
  }

  return { accountPath, detectedScriptType, internalInputIndices };
}
