import type { PredictionsSigningPurpose } from "./signingIntent/types";

/** The live app asked for a document version Ledger Wallet has no text for. */
export class UnsupportedOnboardingVersion extends Error {
  override name = "UnsupportedOnboardingVersion";
}

export class PredictionsBindingSignerMismatch extends Error {
  override name = "PredictionsBindingSignerMismatch";
}

export class PredictionsOrderSignerMismatch extends Error {
  override name = "PredictionsOrderSignerMismatch";
}

/** The order expired before the device signed it, e.g. on a late retry: the live app quotes again. */
export class PredictionsOrderExpired extends Error {
  override name = "PredictionsOrderExpired";
}

/** The Wallet API account to sign with isn't one of the user's EVM accounts. */
export class PredictionsAccountNotFound extends Error {
  override name = "PredictionsAccountNotFound";
}

/** Names the signature in a device error that comes without a message. */
export const SIGNING_ERROR_LABELS: Record<PredictionsSigningPurpose, string> = {
  binding: "Predictions account binding",
  order: "Predictions order",
};

/** What a signature from another key than `address`'s rejects with. */
export function signerMismatchError(purpose: PredictionsSigningPurpose, address: string): Error {
  switch (purpose) {
    case "binding":
      return new PredictionsBindingSignerMismatch(`The binding isn't signed by ${address}`);
    case "order":
      return new PredictionsOrderSignerMismatch(`The order isn't signed by ${address}`);
  }
}
