import type { OperationType } from "@ledgerhq/types-live";
import type { TronOperationMode } from "../types/bridge";

export type TronModeTraits = {
  /** The intent amount leaves the spendable balance. */
  spendsAmount: boolean;
  /** The intent carries a recipient the user is sending to, or reclaiming from. */
  carriesRecipient: boolean;
  /** Validating the intent needs the account's staked-resource state. */
  needsResources: boolean;
  /**
   * The operation type this mode produces, for the resource-staking modes the generic mode→type
   * mapping does not model. Absent defers to that mapping.
   */
  operationType?: OperationType;
};

/**
 * How each Tron mode behaves, in one place.
 *
 * `Record<TronOperationMode, …>` is the point: every collection below is derived from this table, so
 * a mode added to the union fails to compile until it is classified here, rather than silently
 * defaulting to "no" in four separate sets. That also makes a deliberate `false` legible as a
 * decision — the alternative, absence from a `Set`, reads identically to an oversight.
 */
export const MODE_TRAITS: Record<TronOperationMode, TronModeTraits> = {
  send: { spendsAmount: true, carriesRecipient: true, needsResources: false },
  freeze: {
    spendsAmount: true,
    carriesRecipient: false,
    needsResources: false,
    operationType: "FREEZE",
  },
  unfreeze: {
    spendsAmount: false,
    carriesRecipient: false,
    needsResources: true,
    operationType: "UNFREEZE",
  },
  vote: {
    spendsAmount: false,
    carriesRecipient: false,
    needsResources: true,
    operationType: "VOTE",
  },
  claimReward: { spendsAmount: false, carriesRecipient: false, needsResources: true },
  withdrawExpireUnfreeze: {
    spendsAmount: false,
    carriesRecipient: false,
    needsResources: true,
    operationType: "WITHDRAW_EXPIRE_UNFREEZE",
  },
  unDelegateResource: {
    // Reclaiming a delegation moves TRX between the account's own buckets rather than spending it,
    // so `status.amount` and `totalSpent` stay 0 and the device screen shows no Amount row.
    spendsAmount: false,
    carriesRecipient: true,
    needsResources: false,
    operationType: "UNDELEGATE_RESOURCE",
  },
  legacyUnfreeze: {
    spendsAmount: false,
    carriesRecipient: true,
    needsResources: true,
    operationType: "LEGACY_UNFREEZE",
  },
};

// `-?` guards a *future* optional boolean trait: an `foo?: boolean` has type `boolean | undefined`,
// which fails `extends boolean` and would be silently dropped without it. It is not what excludes
// `operationType` — that maps to `never` under this test either way.
type BooleanTrait = {
  [K in keyof TronModeTraits]-?: TronModeTraits[K] extends boolean ? K : never;
}[keyof TronModeTraits];

// Sets rather than repeated table lookups so callers keep the `has(mode)` shape they test an
// untrusted `transaction.mode` with, and so a prototype member like `constructor` cannot answer yes.
const modesWith = (trait: BooleanTrait): ReadonlySet<string> =>
  new Set(
    Object.entries(MODE_TRAITS)
      .filter(([, traits]) => traits[trait])
      .map(([mode]) => mode),
  );

export const MODES_WITH_RECIPIENT = modesWith("carriesRecipient");
export const MODES_SPENDING_AMOUNT = modesWith("spendsAmount");
export const MODES_NEEDING_RESOURCES = modesWith("needsResources");

/**
 * Every mode the Tron UI can produce. Widened to `string` so an untrusted `transaction.mode` can be
 * tested against it; exhaustive by construction, since it is the table's own key set.
 */
export const SUPPORTED_MODES: ReadonlySet<string> = new Set(Object.keys(MODE_TRAITS));

/** The staking modes that carry their own operation type. */
export const RESOURCE_STAKING_OPERATION_TYPES: ReadonlyMap<string, OperationType> = new Map(
  Object.entries(MODE_TRAITS).flatMap(([mode, { operationType }]) =>
    operationType ? [[mode, operationType] as const] : [],
  ),
);
