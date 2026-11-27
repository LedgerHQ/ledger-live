import {
  concatMap,
  defer,
  finalize,
  from,
  lastValueFrom,
  mergeAll,
  toArray,
  type Observable,
} from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { abortReason } from "@domain/api-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { currencyIdFromNetwork } from "@domain/entity-network";
import type {
  CompleteAccounts,
  NeedsCompletion,
} from "@features/platform-account-discovery/descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import { getAccountCompletion, loadSetupForFamily } from "../../coin-modules/registry";
import type { RunOnTransport } from "../../coin-modules/types";
import { MissingAccountCompletionError } from "./errors";
import { onSession, type DeviceSession } from "./session";

const currencyOf = (descriptor: AccountDescriptor) =>
  getCryptoCurrencyById(currencyIdFromNetwork(descriptor.network));

/** Whether the descriptor's family has a completion step, from the loader alone. */
export const needsCompletion: NeedsCompletion = descriptor =>
  getAccountCompletion(currencyOf(descriptor).family) !== undefined;

function byCurrency(selected: readonly AccountDescriptor[]) {
  const groups = new Map<string, AccountDescriptor[]>();
  for (const descriptor of selected) {
    const currencyId = currencyIdFromNetwork(descriptor.network);
    groups.set(currencyId, [...(groups.get(currencyId) ?? []), descriptor]);
  }
  return [...groups.values()];
}

type DeviceJob<T> = (transport: Transport, signal: AbortSignal) => Observable<T>;

/** A job queued past the abort never starts. */
function runQueued<T>(
  session: DeviceSession,
  signal: AbortSignal,
  job: DeviceJob<T>,
): Promise<T[]> {
  if (signal.aborted) return Promise.reject(abortReason(signal));
  const transport = new DmkCompatTransport(session.dmk, session.sessionId);
  return lastValueFrom(job(transport, signal).pipe(toArray()));
}

/** Runs each device job on the session's queue, on a fresh transport. */
function sessionRunner(session: DeviceSession, signal: AbortSignal): RunOnTransport {
  return job =>
    defer(() => onSession(session, () => runQueued(session, signal, job))).pipe(mergeAll());
}

async function completeGroup(runOnTransport: RunOnTransport, group: AccountDescriptor[]) {
  const currency = currencyOf(group[0]);
  const setup = await loadSetupForFamily(currency.family);
  if (!setup.completeAccountDescriptors) {
    throw new MissingAccountCompletionError(`${currency.family} has no completeAccountDescriptors`);
  }
  return setup.completeAccountDescriptors(runOnTransport, currency, group);
}

/** Completes on a Device Intent job's session, after any derivation still running on it; unsubscribing lets the device call in flight settle. */
export function completeOnSession(session: DeviceSession): CompleteAccounts {
  return selected =>
    defer(() => {
      const controller = new AbortController();
      const runOnTransport = sessionRunner(session, controller.signal);
      return from(byCurrency(selected)).pipe(
        concatMap(group => completeGroup(runOnTransport, group)),
        concatMap(events => events),
        finalize(() => controller.abort()),
      );
    });
}
