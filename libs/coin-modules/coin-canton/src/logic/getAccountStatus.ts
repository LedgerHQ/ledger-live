import type { CantonCoinConfig, CantonContext } from "../config";
import { getPartyByPubKey, isPartyNotFoundByPublicKey } from "../network/gateway";
import { TopologyChangeError } from "../types/errors";
import { isPartyUsed, readPartyState } from "./partyState";

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

const isAbortSignal = (value: unknown): value is AbortSignal =>
  typeof AbortSignal !== "undefined" && value instanceof AbortSignal;

// Some React Native AbortSignal polyfills leave `reason` unset.
const abortReason = ({ reason }: AbortSignal): unknown =>
  reason ?? Object.assign(new Error("The read was aborted"), { name: "AbortError" });

// The gateway client takes no signal: an abort rejects without waiting for the request in flight.
function abortable<T>(signal: AbortSignal | undefined, read: () => Promise<T>): Promise<T> {
  if (!signal) return read();
  if (signal.aborted) return Promise.reject(abortReason(signal));
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(abortReason(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    read()
      .then(resolve, reject)
      .finally(() => signal.removeEventListener("abort", onAbort));
  });
}

const signalOf = ({ signal }: CantonContext): AbortSignal | undefined =>
  isAbortSignal(signal) ? signal : undefined;

export type CantonAccountStatus = { used: boolean; isOnboarded: boolean };

export async function getAccountStatus(
  context: CantonContext,
  currencyId: string,
  publicKey: string,
): Promise<CantonAccountStatus> {
  const signal = signalOf(context);
  return abortable(signal, () => readAccountStatus(context, currencyId, publicKey, signal));
}

async function readAccountStatus(
  context: CantonContext,
  currencyId: string,
  publicKey: string,
  signal: AbortSignal | undefined,
): Promise<CantonAccountStatus> {
  const config = await context.config();
  signal?.throwIfAborted();
  const partyId = await partyOf(config, publicKey);
  if (!partyId) return { used: false, isOnboarded: false };
  const { hasNativeOperations, totalBalance, tokenBalances, pendingTransferProposals } =
    await readPartyState(context, currencyId, partyId, signal ? { signal } : {});
  const used = isPartyUsed({
    nativeOperationsCount: hasNativeOperations ? 1 : 0,
    totalBalance,
    tokensCount: tokenBalances.length,
    pendingTransferProposals,
  });
  return { used, isOnboarded: true };
}
