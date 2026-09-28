/** The account's family exposes no sponsored-send seam, so the sponsored flow can't run for it. */
export class SponsoredSendUnavailableError extends Error {
  override name = "SponsoredSendUnavailableError";
  constructor() {
    super("Sponsored send is unavailable for this account");
  }
}
