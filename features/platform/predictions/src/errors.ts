/** The live app asked for a document version Ledger Wallet has no text for. */
export class UnsupportedOnboardingVersion extends Error {
  override name = "UnsupportedOnboardingVersion";
}
