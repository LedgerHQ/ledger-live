/** The live app asked for a document version Ledger Wallet has no text for. */
export class UnsupportedOnboardingVersion extends Error {
  override name = "UnsupportedOnboardingVersion";
}

export class PredictionsBindingSignerMismatch extends Error {
  override name = "PredictionsBindingSignerMismatch";
}

/** The Wallet API account to bind isn't one of the user's EVM accounts. */
export class PredictionsBindingAccountNotFound extends Error {
  override name = "PredictionsBindingAccountNotFound";
}
