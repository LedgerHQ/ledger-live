export class CeloAllFundsWarning extends Error {
  override name = "CeloAllFundsWarning";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CeloAllFundsWarning");
    if (fields) Object.assign(this, fields);
  }
}

export class CeloGroupNotVotable extends Error {
  override name = "CeloGroupNotVotable";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CeloGroupNotVotable");
    if (fields) Object.assign(this, fields);
  }
}

export class CeloGroupNotVoted extends Error {
  override name = "CeloGroupNotVoted";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CeloGroupNotVoted");
    if (fields) Object.assign(this, fields);
  }
}

/**
 * Raised when a Celo staking action is temporarily blocked by the network.
 *
 * Since the Celo L1→L2 migration, epoch processing runs on-chain in a short
 * window during which the `EpochManager` blocks staking mutations. Any function
 * carrying the `onlyWhenNotBlocked` modifier (e.g. `Election.vote`) reverts with
 * "Contract is blocked from performing this action" until processing completes.
 * This is a transient on-chain state, not a defect — retrying after the window
 * closes succeeds.
 */
export class CeloEpochProcessingActive extends Error {
  override name = "CeloEpochProcessingActive";
  constructor(message?: string, fields?: Record<string, unknown>) {
    super(message || "CeloEpochProcessingActive");
    if (fields) Object.assign(this, fields);
  }
}
