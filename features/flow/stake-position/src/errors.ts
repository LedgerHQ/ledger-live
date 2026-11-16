/** The Wallet API account id matches no account of the host. */
export class StakePositionAccountNotFound extends Error {
  override name = "StakePositionAccountNotFound";
}

/** A token account, or an account whose family has no position view. */
export class StakePositionUnsupported extends Error {
  override name = "StakePositionUnsupported";
}

/** A position is being signed or broadcast: a new request would orphan it. */
export class StakePositionBusy extends Error {
  override name = "StakePositionBusy";
}
