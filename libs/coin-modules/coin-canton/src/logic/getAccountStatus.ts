import type { CantonCoinConfig, CantonContext } from "../config";
import { getPartyByPubKey } from "../network/gateway";
import { TopologyChangeError } from "../types/errors";
import { isPartyUsed, readPartyState } from "./partyState";

// The gateway answers a key with no party by a "party not found" error (a `TopologyChangeError`) or a 404.
const isNoParty = (error: unknown) =>
  error instanceof TopologyChangeError ||
  (error instanceof Error &&
    error.name === "LedgerAPI4xx" &&
    "status" in error &&
    error.status === 404);

/** The party of a public key, `undefined` when it has none; any other failure rejects, unlike `isAccountOnboarded`. */
async function partyOf(config: CantonCoinConfig, publicKey: string): Promise<string | undefined> {
  try {
    const { party_id } = await getPartyByPubKey(config, publicKey);
    return party_id || undefined;
  } catch (error) {
    if (isNoParty(error)) return undefined;
    throw error;
  }
}

const isAbortSignal = (value: unknown): value is AbortSignal => value instanceof AbortSignal;

const signalOf = ({ signal }: CantonContext): AbortSignal | undefined =>
  isAbortSignal(signal) ? signal : undefined;

export type CantonAccountStatus = { used: boolean; isOnboarded: boolean };

/** The party of a public key: onboarded once it has one, used as the sync of a new account decides. */
export async function getAccountStatus(
  context: CantonContext,
  currencyId: string,
  publicKey: string,
): Promise<CantonAccountStatus> {
  const signal = signalOf(context);
  const config = await context.config();
  signal?.throwIfAborted();
  const partyId = await partyOf(config, publicKey);
  if (!partyId) return { used: false, isOnboarded: false };
  const { operations, totalBalance, tokenBalances, pendingTransferProposals } =
    await readPartyState(context, currencyId, partyId, signal ? { signal } : {});
  const used = isPartyUsed({
    nativeOperationsCount: operations.filter(
      ({ asset }) => asset.instrumentId === config.nativeInstrumentId,
    ).length,
    totalBalance,
    tokensCount: tokenBalances.length,
    pendingTransferProposals,
  });
  return { used, isOnboarded: true };
}
