import type { PredictionsSigningPurpose } from "./signingIntent/types";

/** The live app asked for a document version Ledger Wallet has no text for. */
export class UnsupportedOnboardingVersion extends Error {
  override name = "UnsupportedOnboardingVersion";
}

export class PredictionsBindingSignerMismatch extends Error {
  override name = "PredictionsBindingSignerMismatch";
}

/** The Wallet API account to sign with isn't one of the user's EVM accounts. */
export class PredictionsAccountNotFound extends Error {
  override name = "PredictionsAccountNotFound";
}

/** Names the signature in a device error that comes without a message. */
export const SIGNING_ERROR_LABELS: Record<PredictionsSigningPurpose, string> = {
  binding: "Predictions account binding",
};

/** What a signature from another key than `address`'s rejects with. */
export function signerMismatchError(purpose: PredictionsSigningPurpose, address: string): Error {
  switch (purpose) {
    case "binding":
      return new PredictionsBindingSignerMismatch(`The binding isn't signed by ${address}`);
  }
}
