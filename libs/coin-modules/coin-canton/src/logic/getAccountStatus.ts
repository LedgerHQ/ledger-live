import { abortable, throwIfAborted } from "@ledgerhq/coin-module-framework/promises";
import type { CantonCoinConfig, CantonContext } from "../config";
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

async function partyOf(config: CantonCoinConfig, publicKey: string): Promise<string | undefined> {
  try {
    const { party_id } = await getPartyByPubKey(config, publicKey);
    return party_id || undefined;
  } catch (error) {
    if (isNoParty(error)) return undefined;
    throw error;
  }
}

export type CantonAccountStatus = { used: boolean; isOnboarded: boolean };

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
    const partyId = await partyOf(config, publicKey);
    if (!partyId) return { used: false, isOnboarded: false };
    throwIfAborted(signal);
    const { totalBalance, pendingTransferProposals, calTokens, tokenBalances } =
      await readPartyBalances(context, currencyId, partyId, undefined, signal);
    throwIfAborted(signal);
    const hasEnabledToken = async () => {
      if (tokenBalances.length === 0) return false;
      const enabledInstruments = await getEnabledInstrumentsStrictCached(config);
      return tokenBalances.some(({ token }) =>
        isTokenEnabled(token, calTokens, enabledInstruments),
      );
    };
    // Cheapest proof first: a funded party never waits on the instruments or its history.
    const used =
      !totalBalance.isZero() ||
      pendingTransferProposals.length > 0 ||
      (await hasEnabledToken()) ||
      (await hasNativeOperation(config, partyId, pendingTransferProposals, signal));
    return { used, isOnboarded: true };
  });
}
