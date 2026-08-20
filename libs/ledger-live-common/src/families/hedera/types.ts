// Encapsulate for LLD & LLM
export * from "@ledgerhq/coin-hedera/types/index";

import type { GenericTransaction } from "../../bridge/generic-coin-framework/types";

/**
 * The real transaction shape once Hedera is on the generic framework — literal-branded so it
 * narrows correctly alongside every other family in `coin-modules/transaction-types.ts`'s big
 * `Transaction` union (a bare `GenericTransaction`, with `family: string`, breaks that union's
 * `switch (transaction.family)` narrowing for every *other* family, not just this one).
 *
 * Deliberately a new, additional export rather than replacing this file's re-exported `Transaction`
 * above: the send flow (`MemoField.tsx`) and mobile (LIVE-36152, not yet migrated) still read the
 * legacy `properties`/`memo` shape that re-export provides. Only the staking flows (LIVE-36151) use
 * this one.
 */
export type HederaGenericTransaction = GenericTransaction & { family: "hedera" };
