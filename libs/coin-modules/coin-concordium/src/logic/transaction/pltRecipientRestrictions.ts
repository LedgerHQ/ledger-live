import { log } from "@ledgerhq/logs";
import { findAccountTokenEntry, getListVerdict } from "../../network/plt";
import { fetchAccountTokens, fetchPltModuleState } from "../../network/pltRecipient";
import {
  ConcordiumRecipientDenied,
  ConcordiumRecipientNotAllowed,
  ConcordiumRecipientNotFound,
  ConcordiumRecipientRestrictionsUnverified,
} from "../../types/errors";
import type { ConcordiumCoinConfig } from "../../types";

type RecipientCheck = {
  config: ConcordiumCoinConfig;
  currencyId: string;
  recipient: string;
  tokenId: string;
  /** Interpolated into every message this returns, so the user is told which token refused. */
  ticker: string;
};

/**
 * Decides whether a PLT transfer's recipient may hold the token.
 *
 * A transfer the lists refuse is rejected on chain *after* signing, and the fee
 * is charged anyway, so this is the check that keeps the CCD. The chain rule
 * itself lives in {@link getListVerdict}; this resolves the two pieces of state
 * that rule needs and names the resulting error.
 *
 * Resolves rather than throws, and that is load-bearing rather than incidental:
 * a rejection reaches `useBridgeRecipientValidation`, which catches it and
 * reports *no* error, letting the recipient step pass clean — the exact opposite
 * of blocking. The whole body is therefore wrapped, so the guarantee holds for a
 * reader that is added later without one of its own, not just for the lookups
 * that exist today.
 *
 * Every failure blocks. A lookup that did not complete leaves the recipient's
 * standing unknown, and passing an unknown as allowed is how the fee gets
 * burned; the error says the check could not be made rather than that the
 * address was refused, because those call for different things from the user.
 * Retries are left at the proxy client's default: this fails closed, so one
 * transport blip would otherwise present as a refusal.
 */
export async function checkRecipientRestrictions(
  check: RecipientCheck,
): Promise<Error | undefined> {
  try {
    return await resolveRestrictions(check);
  } catch (error) {
    log("concordium-plt", "Could not resolve the recipient's token restrictions", { error });
    return new ConcordiumRecipientRestrictionsUnverified("", { ticker: check.ticker });
  }
}

/**
 * The check itself, free to throw because its only caller converts that into a
 * blocking verdict.
 *
 * The token's module state is read first, and a token declaring neither list
 * returns before the recipient is looked up at all. That is not only cheaper —
 * one cached token-level read serves every recipient — it also keeps the
 * recipient's address out of a request that could not change the outcome. The
 * cost is that a recipient who does not exist on chain is only reported for a
 * token that already forces the read; for a list-free token the send proceeds
 * and the chain reports `addressNotFound` after signing.
 */
async function resolveRestrictions({
  config,
  currencyId,
  recipient,
  tokenId,
  ticker,
}: RecipientCheck): Promise<Error | undefined> {
  const moduleState = await fetchPltModuleState({ config, currencyId, tokenId });
  if (!moduleState) return new ConcordiumRecipientRestrictionsUnverified("", { ticker });

  // Neither list declared: no recipient can be refused, so no recipient read.
  if (moduleState.allowList !== true && moduleState.denyList !== true) return undefined;

  const account = await fetchAccountTokens({ config, currencyId, address: recipient });
  if (account.status === "unreadable") {
    return new ConcordiumRecipientRestrictionsUnverified("", { ticker });
  }
  if (account.status === "absent") return new ConcordiumRecipientNotFound("", { ticker });

  const verdict = getListVerdict(moduleState, findAccountTokenEntry(account.entries, tokenId));

  if (verdict === "allowed") return undefined;
  if (verdict === "denied") return new ConcordiumRecipientDenied("", { ticker });
  if (verdict === "notAllowed") return new ConcordiumRecipientNotAllowed("", { ticker });

  // Gated on `!== "allowed"` rather than on `=== "unknown"`, matching
  // `validateTokenPolicy`: a verdict this does not recognise — a member added to
  // the union later, most likely — blocks as unverifiable instead of falling
  // through to the `undefined` that means allowed.
  return new ConcordiumRecipientRestrictionsUnverified("", { ticker });
}
