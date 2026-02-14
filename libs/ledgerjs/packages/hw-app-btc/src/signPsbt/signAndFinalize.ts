import { PsbtV2 } from "@ledgerhq/psbtv2";
import type { AccountType } from "../newops/accounttype";
import { createKey, WalletPolicy } from "../newops/policy";
import { extract } from "../newops/psbtExtractor";
import { finalize } from "../newops/psbtFinalizer";

/**
 * Creates a WalletPolicy for the given account.
 */
export function createWalletPolicy(
  masterFp: Buffer,
  accountPath: number[],
  accountXpub: string,
  accountType: AccountType,
): WalletPolicy {
  const key = createKey(masterFp, accountPath, accountXpub);
  return new WalletPolicy(accountType.getDescriptorTemplate(), key);
}

/**
 * Creates a progress callback that notifies onDeviceStreaming and onDeviceSignatureGranted.
 */
export function createProgressCallback(
  inputCount: number,
  options?: {
    onDeviceSignatureRequested?: () => void;
    onDeviceSignatureGranted?: () => void;
    onDeviceStreaming?: (arg: { progress: number; total: number; index: number }) => void;
  },
): () => void {
  let notifyCount = 0;
  let firstSigned = false;

  const progress = () => {
    if (!options?.onDeviceStreaming) return;
    options.onDeviceStreaming({
      total: 2 * inputCount,
      index: notifyCount,
      progress: ++notifyCount / (2 * inputCount),
    });
  };

  if (options?.onDeviceSignatureRequested) options.onDeviceSignatureRequested();

  return () => {
    if (!firstSigned) {
      firstSigned = true;
      if (options?.onDeviceSignatureGranted) options.onDeviceSignatureGranted();
    }
    progress();
  };
}

/**
 * Optionally finalizes the PSBT and, when finalizing, extracts the transaction.
 * When not finalizing, only the serialized PSBT (with partial signatures) is
 * returned; extraction is not performed because FINAL_SCRIPTWITNESS is not set.
 */
export function finalizePsbtAndExtract(
  psbt: PsbtV2,
  shouldFinalize?: boolean,
): { psbt: Buffer; tx?: string } {
  if (shouldFinalize ?? true) {
    finalize(psbt);
    return {
      psbt: psbt.serialize(),
      tx: extract(psbt).toString("hex"),
    };
  }
  return {
    psbt: psbt.serialize(),
  };
}
