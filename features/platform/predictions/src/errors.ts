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
