/** The account's family exposes no sponsored-send seam, so the sponsored flow can't run for it. */
export class SponsoredSendUnavailableError extends Error {
  override name = "SponsoredSendUnavailableError";
  constructor() {
    super("Sponsored send is unavailable for this account");
  }
}

/** No sponsored fee was approved on Review to bind the rent order to. */
export class SponsoredFeeNotApprovedError extends Error {
  override name = "SponsoredFeeNotApprovedError";
  constructor() {
    super("No sponsored fee was approved on Review");
  }
}
