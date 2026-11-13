import { defer, from, lastValueFrom, map, type Observable } from "rxjs";
import { abortReason } from "@domain/api-account-data";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  AccountDescriptorSchema,
  currencyIdFromNetwork,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import type { AccountCandidate } from "@domain/entity-derivation";
import type { DeriveAccount, LookedUpAccount } from "@features/platform-account-discovery";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import getAddress from "../../hw/getAddress";
import { keyOfDerivedAccount } from "../../account/accountDescriptor";
import { getAccountDescriptorType, loadSetupForFamily } from "../../coin-modules/registry";
import type { RunOnTransport } from "../../coin-modules/types";
import { resolveFamily } from "../../bridge/zcashRouting";
import { toLegacyPath } from "../full-sync/placeholderAccount";
import { LegacyDeriveUnsupportedError } from "./errors";

function deriveAddress(
  runOnTransport: RunOnTransport,
  candidate: AccountCandidate,
): Observable<AccountDescriptor> {
  const currency = getCryptoCurrencyById(currencyIdFromNetwork(candidate.network));
  return runOnTransport(transport =>
    from(
      getAddress(transport, {
        currency,
        path: toLegacyPath(candidate.addressPath),
        derivationMode: asDerivationMode(candidate.derivationMode),
      }),
    ),
  ).pipe(
    map(derived =>
      AccountDescriptorSchema.parse({
        purpose: "account",
        version: "2",
        type: "address",
        network: candidate.network,
        key: keyOfDerivedAccount(currency.id, derived),
        path: candidate.addressPath,
      }),
    ),
  );
}

/**
 * Unsubscribing does not cancel a device call: an aborted derivation settles once its call does, then
 * rejects, so the next derivation finds the device free.
 */
function settledThenAborted<T>(
  source$: Observable<T>,
  signal: AbortSignal | undefined,
): Promise<T> {
  if (signal?.aborted) return Promise.reject(abortReason(signal));
  const throwIfAborted = () => {
    if (signal?.aborted) throw abortReason(signal);
  };
  return lastValueFrom(source$).then(
    value => {
      throwIfAborted();
      return value;
    },
    (error: unknown) => {
      throwIfAborted();
      throw error;
    },
  );
}

/** Derives a candidate with the family's resolver or its own derivation, as `scanAccounts` would; an abort rejects once the device answered. */
export function deriveOnTransport(runOnTransport: RunOnTransport): DeriveAccount {
  return async (candidate, signal) => {
    const currency = getCryptoCurrencyById(currencyIdFromNetwork(candidate.network));
    const family = resolveFamily(currency);
    const setup = await loadSetupForFamily(family);
    const derive = (): Observable<AccountDescriptor | LookedUpAccount | null> => {
      if (setup.deriveAccountDescriptor) {
        return setup.deriveAccountDescriptor(runOnTransport, currency, candidate);
      }
      if (getAccountDescriptorType(family) !== "address") {
        throw new LegacyDeriveUnsupportedError(`${family} has no deriveAccountDescriptor`);
      }
      return deriveAddress(runOnTransport, candidate);
    };
    return settledThenAborted(defer(derive), signal).catch((error: unknown) => {
      if (setup.endsScanOn?.(error)) return null;
      throw error;
    });
  };
}

/** The session a Device Intent job runs on: the executor opened the currency app on it. */
export type DeviceSession = { readonly dmk: DeviceManagementKit; readonly sessionId: string };

const sessionTails = new WeakMap<DeviceManagementKit, Map<string, Promise<void>>>();

/** Runs `task` once the session's previous derivation settled, across scans: the call of a stopped scan may still run when the next one starts. */
function onSession<T>({ dmk, sessionId }: DeviceSession, task: () => Promise<T>): Promise<T> {
  const tails = sessionTails.get(dmk) ?? new Map<string, Promise<void>>();
  sessionTails.set(dmk, tails);
  const result = (tails.get(sessionId) ?? Promise.resolve()).then(task);
  const tail = result.then(
    () => undefined,
    () => undefined,
  );
  tails.set(sessionId, tail);
  void tail.then(() => {
    if (tails.get(sessionId) === tail) tails.delete(sessionId);
  });
  return result;
}

/**
 * Derives on the session of a Device Intent job. A transport per derivation: a ledgerjs app
 * locks its transport while a call runs, and an aborted call must not block the next one.
 */
export function deriveOnSession(session: DeviceSession): DeriveAccount {
  const derive = deriveOnTransport(job =>
    defer(() => job(new DmkCompatTransport(session.dmk, session.sessionId))),
  );
  // The derivation checks its signal once it has the session: one stopped while queued never calls the device.
  return (candidate, signal) => onSession(session, () => derive(candidate, signal));
}
