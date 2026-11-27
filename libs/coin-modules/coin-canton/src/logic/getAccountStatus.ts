import { abortable, throwIfAborted } from "@ledgerhq/coin-module-framework/promises";
import { pinConfig, type CantonContext } from "../config";
import {
  getEnabledInstrumentsStrictCached,
  getPartyByPubKey,
  isPartyNotFoundByPublicKey,
} from "../network/gateway";
import { TopologyChangeError } from "../types/errors";
import { hasNativeOperation, isTokenEnabled, readPartyBalances } from "./partyState";

// The gateway answers a key with no party by a "party not found" error (a `TopologyChangeError`), a 400 or a 404.
const isNoParty = (error: unknown) =>
  error instanceof TopologyChangeError ||
  isPartyNotFoundByPublicKey(error) ||
  (error instanceof Error &&
    error.name === "LedgerAPI4xx" &&
    "status" in error &&
    error.status === 404);

async function partyOf(context: CantonContext, publicKey: string): Promise<string | undefined> {
  try {
    const { party_id } = await getPartyByPubKey(context, publicKey);
    return party_id || undefined;
  } catch (error) {
    if (isNoParty(error)) return undefined;
    throw error;
  }
}

export type CantonAccountStatus = { activated: boolean; used: boolean };

/** Reads a key's party as the sync would, `used` matching the sync's `used` (see `isCantonAccountEmpty`). */
export function getAccountStatus(
  context: CantonContext,
  currencyId: string,
  publicKey: string,
): Promise<CantonAccountStatus> {
  const signal = context.signal instanceof AbortSignal ? context.signal : undefined;
  return abortable(signal, async () => {
    const config = await context.config();
    throwIfAborted(signal);
    const pinned = pinConfig(context, config);
    const partyId = await partyOf(pinned, publicKey);
    if (!partyId) return { activated: false, used: false };
    throwIfAborted(signal);
    const { totalBalance, pendingTransferProposals, calTokens, tokenBalances } =
      await readPartyBalances(pinned, currencyId, partyId, undefined, signal);
    throwIfAborted(signal);
    const hasEnabledToken = async () => {
      if (tokenBalances.length === 0) return false;
      const enabledInstruments = await getEnabledInstrumentsStrictCached(pinned);
      return tokenBalances.some(({ token }) =>
        isTokenEnabled(token, calTokens, enabledInstruments),
      );
    };
    // Cheapest proof first: a funded party never waits on the instruments or its history.
    const used =
      !totalBalance.isZero() ||
      pendingTransferProposals.length > 0 ||
      (await hasEnabledToken()) ||
      (await hasNativeOperation(pinned, partyId, pendingTransferProposals, signal));
    return { activated: true, used };
  });
}
