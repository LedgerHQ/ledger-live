import type { PerpsTransaction } from "./perpsApi";
import { assertSignedBy, signatureToHex, type HyperliquidSignature } from "./perpsSignature";

/** Device side of a Hyperliquid signature, faked in unit tests. */
export type HyperliquidDevice = {
  /** True when a review is already on screen. */
  isShowingReview(): Promise<boolean>;
  signActions(
    signedMetadata: string,
    rawPayloads: Record<string, unknown>[],
    signal: AbortSignal,
  ): Promise<HyperliquidSignature[]>;
  approveReview(): Promise<void>;
};

export type SignRequest = {
  address: string;
  signedMetadata: string;
  transactions: PerpsTransaction[];
};

function rawPayloadsOf(transactions: PerpsTransaction[]): Record<string, unknown>[] {
  return transactions.map(tx => {
    if (tx.signingFormat !== "EIP712_TYPED_DATA") {
      throw new Error(`Unsupported signing format ${String(tx.signingFormat)}`);
    }
    if (!tx.rawPayload) throw new Error(`Transaction ${tx.id} has no raw payload`);
    return tx.rawPayload;
  });
}

/** Signs all transactions of one action in one device review. */
export async function signTransactions(
  device: HyperliquidDevice,
  { address, signedMetadata, transactions }: SignRequest,
): Promise<string[]> {
  const rawPayloads = rawPayloadsOf(transactions);
  // A review already on screen was not started here.
  if (await device.isShowingReview()) {
    throw new Error("The device already shows a review the driver did not start");
  }
  const controller = new AbortController();
  const [signatures] = await Promise.all([
    device.signActions(signedMetadata, rawPayloads, controller.signal),
    device.approveReview().catch((error: unknown) => {
      controller.abort();
      throw error;
    }),
  ]);
  if (signatures.length !== transactions.length) {
    throw new Error(`Expected ${transactions.length} signatures, got ${signatures.length}`);
  }
  return transactions.map((tx, index) => {
    const signature = signatureToHex(signatures[index]);
    assertSignedBy(address, tx.signablePayload, signature);
    return signature;
  });
}
