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

export class PredictionsOrderExpired extends Error {
  override name = "PredictionsOrderExpired";
}

/** The Wallet API account to sign with isn't one of the user's EVM accounts. */
export class PredictionsAccountNotFound extends Error {
  override name = "PredictionsAccountNotFound";
}
