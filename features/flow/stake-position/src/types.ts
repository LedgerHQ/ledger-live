/** The host surface that asked for a position. Each app root renders the requests of its origin only. */
export type StakePositionOrigin = "earn";

export type StakePositionState = "active" | "activating" | "deactivating" | "inactive";

export type StakePositionExitAction = "deactivate" | "withdraw";

export type StakePositionAction = StakePositionExitAction | "earnMore";

/** Why the host could not act on the position: the live app falls back to its own row behaviour. */
export type StakePositionUnavailableReason = "ambiguous" | "notFound";

export type StakePositionResult = Readonly<{
  action: StakePositionAction | null;
  reason?: StakePositionUnavailableReason;
}>;

/** The `custom.stake.position.open` params, once validated. */
export type StakePositionOpenParams = Readonly<{
  /** The Wallet API id, as `account.list` returns it. */
  accountId: string;
  positionId: string;
  validatorAddress: string;
  /** Total rewards in the currency's smallest unit, for display only. */
  rewards?: string;
}>;

export type StakePositionSnapshot = Readonly<{
  state: StakePositionState;
  amount: bigint;
  withdrawableAmount: bigint;
  canStake: boolean;
  canWithdraw: boolean;
}>;

export type StakePositionNotice = "deactivating" | "missingAuthority";

export type StakePositionCandidate = Readonly<{
  positionId: string;
  validatorAddress: string;
}>;

export type StakePositionMatch =
  | Readonly<{ kind: "match" }>
  | Readonly<{ kind: "ambiguous" }>
  | Readonly<{ kind: "notFound" }>;

/** What the surface's title says: the position, or the confirmation of its exit. */
export type StakePositionHeading =
  | Readonly<{ kind: "details" }>
  | Readonly<{ kind: "confirm"; action: StakePositionExitAction }>;

/** A formatted amount: the app formats it, with discreet mode applied. */
export type StakePositionAmount = Readonly<{
  crypto: string;
  fiat?: string;
}>;

export type StakePositionPhase = "open" | "committed" | "settled";

export type StakePositionRequestInput = Readonly<{
  /** The host account id, which the app resolves from the Wallet API id. */
  accountId: string;
  positionId: string;
  validatorAddress: string;
  rewards?: string;
}>;

export type ShownStakePositionRequest = StakePositionRequestInput &
  Readonly<{ id: number; origin: StakePositionOrigin }>;

/** Once closed, the last request stays, so the surface animates out with its content. */
export type ShownStakePosition = Readonly<{
  request: ShownStakePositionRequest | null;
  phase: StakePositionPhase | "closed";
}>;
