import { PsbtV2, detectScriptType } from "@ledgerhq/psbtv2";
import { AccountType, p2pkh, p2tr, p2wpkh, p2wpkhWrapped } from "../newops/accounttype";
import type { DefaultDescriptorTemplate } from "../newops/policy";
import type { AddressFormat } from "../getWalletPublicKey";
import type { ScriptType } from "./types";

function descrTemplFrom(addressFormat: AddressFormat): DefaultDescriptorTemplate {
  switch (addressFormat) {
    case "legacy":
      return "pkh(@0)";
    case "p2sh":
      return "sh(wpkh(@0))";
    case "bech32":
      return "wpkh(@0)";
    case "bech32m":
      return "tr(@0)";
    default:
      throw new Error("Unsupported address format " + addressFormat);
  }
}

export function createAccountTypeFromScriptType(
  scriptType: ScriptType,
  psbt: PsbtV2,
  masterFp: Buffer,
): AccountType {
  switch (scriptType) {
    case "p2wpkh":
      return new p2wpkh(psbt, masterFp);
    case "p2tr":
      return new p2tr(psbt, masterFp);
    case "p2sh":
    case "p2sh-p2wpkh":
      return new p2wpkhWrapped(psbt, masterFp);
    case "p2pkh":
      return new p2pkh(psbt, masterFp);
  }
}

export function determineAccountTypeFromWitnessUtxo(
  psbt: PsbtV2,
  inputIndex: number,
  masterFp: Buffer,
): AccountType | null {
  const witnessUtxo = psbt.getInputWitnessUtxo(inputIndex);
  if (!witnessUtxo) {
    return null;
  }

  const scriptType = detectScriptType(witnessUtxo.scriptPubKey);
  if (!scriptType) {
    throw new Error(`Unsupported script type: ${witnessUtxo.scriptPubKey.toString("hex")}`);
  }

  return createAccountTypeFromScriptType(scriptType, psbt, masterFp);
}

export function createAccountTypeFromAddressFormat(
  addressFormat: AddressFormat,
  psbt: PsbtV2,
  masterFp: Buffer,
): AccountType {
  const descrTemplate = descrTemplFrom(addressFormat);

  switch (descrTemplate) {
    case "pkh(@0)":
      return new p2pkh(psbt, masterFp);
    case "wpkh(@0)":
      return new p2wpkh(psbt, masterFp);
    case "sh(wpkh(@0))":
      return new p2wpkhWrapped(psbt, masterFp);
    case "tr(@0)":
      return new p2tr(psbt, masterFp);
    default:
      throw new Error(`Unsupported descriptor template: ${descrTemplate}`);
  }
}

export function determineAccountTypeFromPurpose(
  accountPath: number[],
  psbt: PsbtV2,
  masterFp: Buffer,
): AccountType | null {
  if (accountPath.length < 1) {
    return null;
  }

  const purpose = accountPath[0] - 0x80000000;

  switch (purpose) {
    case 44:
      return new p2pkh(psbt, masterFp);
    case 49:
      return new p2wpkhWrapped(psbt, masterFp);
    case 84:
      return new p2wpkh(psbt, masterFp);
    case 86:
      return new p2tr(psbt, masterFp);
    default:
      return null;
  }
}

/**
 * Determines the account type based on detected script type, account path, or options.
 */
export function determineAccountType(
  psbt: PsbtV2,
  inputIndex: number,
  masterFp: Buffer,
  detectedScriptType: ScriptType | undefined,
  accountPath: number[],
  addressFormat?: AddressFormat,
): AccountType {
  if (detectedScriptType) {
    return createAccountTypeFromScriptType(detectedScriptType, psbt, masterFp);
  }

  const witnessUtxoType = determineAccountTypeFromWitnessUtxo(psbt, inputIndex, masterFp);
  if (witnessUtxoType) {
    return witnessUtxoType;
  }

  if (psbt.getInputRedeemScript(inputIndex)) {
    return new p2wpkhWrapped(psbt, masterFp);
  }

  if (addressFormat) {
    return createAccountTypeFromAddressFormat(addressFormat, psbt, masterFp);
  }

  const purposeBasedType = determineAccountTypeFromPurpose(accountPath, psbt, masterFp);
  if (purposeBasedType) {
    return purposeBasedType;
  }

  return new p2wpkh(psbt, masterFp);
}
