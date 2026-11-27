import type { FormattedValue } from "@ledgerhq/lumen-ui-react";
import type { EarnInterestType, EarnPosition } from "@domain/entity-earn-position";

/** The surface that asked for the position: the Earn live app, or an account screen of the wallet. */
export type StakePositionOrigin = "earn" | "account";

export type StakePositionState = "active" | "activating" | "deactivating" | "inactive";

export type StakePositionExitAction = "deactivate" | "withdraw";

export type StakePositionAction = StakePositionExitAction | "earnMore";

/** The `custom.stake.position.open` params, once validated: the identity of the position only. */
export type StakePositionOpenParams = Readonly<{
  /** The Wallet API id, as `account.list` returns it. */
  accountId: string;
  /** The stake account address on Solana. */
  positionId: string;
}>;

/**
 * The `custom.stake.position.open` answer. `reason` is set for the Earn live app only, when the
 * host could not show the position: Earn then falls back to its own menu.
 */
export type StakePositionOpenResult = Readonly<{
  action: StakePositionAction | null;
  reason?: "unavailable";
}>;

/** The chain state of the position, which builds, gates and signs its exit. */
export type StakePositionSnapshot = Readonly<{
  state: StakePositionState;
  amount: bigint;
  withdrawableAmount: bigint;
  canStake: boolean;
  canWithdraw: boolean;
}>;

/** Why the chain position offers no exit. */
export type StakePositionChainNotice = "deactivating" | "missingAuthority";

export type StakePositionNotice = StakePositionChainNotice | "updating";

/** What the chain decides for the details: the exit and why there is none. It carries no amount. */
export type StakePositionChainExit = Readonly<{
  state: StakePositionState;
  action: StakePositionExitAction | null;
  notice: StakePositionChainNotice | null;
  /** The account is syncing: the exit waits for it. */
  isPending: boolean;
}>;

/** What the surface's title says: the position, the confirmation of its exit, or its result. */
export type StakePositionHeading =
  | Readonly<{ kind: "details" }>
  | Readonly<{ kind: "confirm"; action: StakePositionExitAction }>
  | Readonly<{ kind: "result"; outcome: "success" | "failure" }>;

/** A formatted amount: the app formats it, with discreet mode applied. */
export type StakePositionAmount = Readonly<{
  crypto: string;
  fiat?: string;
}>;

/** The reward rate of the position, formatted, and the kind of rate the backend names. */
export type StakePositionRate = Readonly<{
  /** The rate as a percentage, such as "7.12%". */
  value: string;
  type: EarnInterestType;
}>;

/** The tone of the rate tag: gray where a rate may not be shown in green, success elsewhere. */
export type StakePositionApyAppearance = "success" | "gray";

/** The rewards headline: their counter value, which `AmountDisplay` draws. */
export type StakePositionRewardsHeadline = Readonly<{
  /** The counter value, in the unit `formatter` expects. */
  value: number;
  formatter: (value: number) => FormattedValue;
  /** Masks the amount, in discreet mode. */
  hidden: boolean;
}>;

/** The app's formatting: its unit, locale, counter value and discreet mode. */
export type StakePositionFormatter = Readonly<{
  /** An amount in the smallest unit of the currency, with its counter value when the rate is known. */
  amount: (baseUnits: string) => StakePositionAmount;
  /** The counter value headline of an amount in the smallest unit. Undefined without a rate. */
  rewardsHeadline: (baseUnits: string) => StakePositionRewardsHeadline | undefined;
  /** A fraction as a percentage with two decimals: 0.046 as "4.60%". */
  percent: (fraction: number) => string;
}>;

export type StakePositionPhase = "open" | "signing" | "committed" | "settled";

export type StakePositionRequestInput = Readonly<{
  /** The host account id, which the app resolves from the Wallet API id. */
  accountId: string;
  positionId: string;
}>;

export type ShownStakePositionRequest = StakePositionRequestInput &
  Readonly<{ id: number; origin: StakePositionOrigin }>;

/** Once closed, the last request stays, so the surface animates out with its content. */
export type ShownStakePosition = Readonly<{
  request: ShownStakePositionRequest | null;
  phase: StakePositionPhase | "closed";
}>;

/** The position as the Earn backend reports it, ready for the details. */
export type ReadyStakePositionData = Readonly<{
  kind: "ready";
  position: EarnPosition;
  /** The backend status, as the details show it. */
  status: StakePositionState;
  /** Some backend rows were missing or past their time to live when it answered. */
  isStale: boolean;
  /** The backend has not shown the user's own transaction on this position yet. */
  isPolling: boolean;
}>;

export type StakePositionData =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "notFound" }>
  | Readonly<{ kind: "error"; retry: () => void }>
  /** The Earn live app's request is closed and answered `reason: "unavailable"`. */
  | Readonly<{ kind: "unavailable" }>
  | ReadyStakePositionData;

/** A transaction the user broadcast on a position, which its next reads wait for. */
export type StakePositionTransaction = Readonly<{
  ownerAddress: string;
  positionId: string;
  action: StakePositionExitAction;
}>;
