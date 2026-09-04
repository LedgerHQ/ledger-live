import { z } from "zod";
import {
  AccountIdSchema,
  BigNumberStrSchema,
  DateTimeIsoSchema,
  type AccountId,
} from "@shared/schema-primitives";
import { CryptoCurrencyIdSchema } from "@domain/entity-currency-crypto";
import { TokenCurrencyIdSchema } from "@domain/entity-currency-token";

/**
 * The asset the operation's amounts are denominated in.
 *
 * Carried on the row even though the balance entity already holds one per account, and that
 * duplication is deliberate. Deriving it would mean either decoding the account id — which a token
 * account id cannot be — or joining against the balance table, which makes rendering a history
 * impossible until a balance has been read. One string beats a mandatory dependency between two
 * entities that are supposed to be independently loadable.
 */
export const OperationAssetIdSchema = z.union([CryptoCurrencyIdSchema, TokenCurrencyIdSchema]);

/**
 * A non-negative amount in the asset's smallest unit.
 *
 * Same refinement as the balance entity's, and deliberately not shared: an operation's `value` and
 * an account's `balance` mean different things, and coupling their schemas would make one entity's
 * validation a breaking change for the other.
 */
export const OperationAmountSchema = BigNumberStrSchema.refine(value => /^\d+$/.test(value), {
  message: "Expected a non-negative integer amount in the asset's smallest unit",
});

/**
 * One operation, as this entity models it.
 *
 * Deliberately **flat**. The legacy `Operation` nests `subOperations` (a token transfer inside a
 * transaction), `internalOperations` (a contract's internal transfers) and `nftOperations` inside
 * their parent, which is why reading a token account's history means walking its parent's. Here they
 * are ordinary rows: a sub-operation is a row whose `accountId` is the token account, and
 * `parentOperationId` says which operation it came out of. Nothing has to be walked.
 *
 * Also deliberately without `extra`: the family-specific bag is exactly the part of the god object
 * this exercise exists to stop carrying, and no consumer of a history list needs it. A screen that
 * genuinely does — a family-specific operation detail — is the argument for a *family* slice, not
 * for widening this one.
 */
export const AccountOperationSchema = z.object({
  /** Unique across accounts; the legacy `operationId` encoding is preserved as-is. */
  id: z.string().min(1),
  /** The account this operation belongs to — a main account or one of its token accounts. */
  accountId: AccountIdSchema,
  /** What `value` and `fee` are denominated in. See {@link OperationAssetIdSchema}. */
  assetId: OperationAssetIdSchema,
  hash: z.string().min(1),
  /**
   * `IN`, `OUT`, `FEES`, `NFT_IN`… — a plain string, not a union.
   *
   * Families extend the set (staking, governance, opt-in), so an enum here would make adding a
   * family's operation type a change to a shared domain package.
   */
  type: z.string().min(1),
  /** Absolute value moved. `OUT` includes the fee, `IN` excludes it — the legacy convention. */
  value: OperationAmountSchema,
  fee: OperationAmountSchema,
  senders: z.array(z.string()),
  recipients: z.array(z.string()),
  /** `null` while the operation is still pending — not yet in a block. */
  blockHeight: z.number().int().nonnegative().nullable(),
  date: DateTimeIsoSchema,
  hasFailed: z.boolean().optional(),
  /** Set when this row was nested inside another operation — a token transfer, an internal call. */
  parentOperationId: z.string().min(1).optional(),
});

export type AccountOperation = z.infer<typeof AccountOperationSchema>;

/**
 * One account's loaded window onto its history.
 *
 * A *window*, not the history: this is the first slice whose data is inherently unbounded, and
 * pretending the table holds all of it is what would make every consumer wrong. The three fields
 * around `operations` are what make the window honest.
 */
export type AccountOperationsEntry = {
  /** Newest first, matching every list that renders it and the order sources page in. */
  operations: AccountOperation[];
  /** Where the next page resumes. `undefined` means there is no next page to ask for. */
  nextCursor?: string;
  /** Whether `operations` is the entire history, or only the pages read so far. */
  complete: boolean;
  /**
   * When the newest page was last read.
   *
   * On the account, not on a row: a row's `date` is when the operation happened, which says nothing
   * about when we last looked for newer ones. That difference is the reason this slice cannot reuse
   * the balance slice's freshness rule.
   */
  at?: string;
  /**
   * Total number of operations the account has, when a source can say.
   *
   * `undefined` is the normal case on a paginated read, and that is the point: `operationsCount` on
   * the legacy account is a number the full sync can produce because it holds everything. A source
   * that reads one page cannot know it, and a UI that shows "N transactions" has to say so.
   */
  total?: number;
};

/** Outcome of the last read for one account. `error` is a message, so the state stays serializable. */
export type AccountOperationsStatus = {
  pending: boolean;
  error?: string;
  /** Id of the source that last answered — which world served this account. */
  sourceId?: string;
};

export const IDLE_ACCOUNT_OPERATIONS_STATUS: AccountOperationsStatus = { pending: false };
export const EMPTY_ACCOUNT_OPERATIONS_ENTRY: AccountOperationsEntry = {
  operations: [],
  complete: false,
};

export type AccountOperationsState = {
  byAccount: Record<AccountId, AccountOperationsEntry>;
  status: Record<AccountId, AccountOperationsStatus>;
};

/** Redux state contract: apps must mount {@link accountOperationsSlice} under this exact key. */
export type WithAccountOperations = { accountOperations: AccountOperationsState };

export const initialAccountOperationsState: AccountOperationsState = { byAccount: {}, status: {} };
