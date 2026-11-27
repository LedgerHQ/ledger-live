import { defer, from, lastValueFrom, map, type Observable } from "rxjs";
import { abortReason } from "@domain/api-account-data";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type {
  DeriveAccount,
  LookedUpAccount,
} from "@features/platform-account-discovery/descriptor";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  asDerivationMode,
  getSeedIdentifierDerivation,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import { fromDescriptorPath } from "@domain/entity-derivation";
import { currencyIdFromNetwork } from "@domain/entity-network";
import { getAccountDescriptorType, loadSetupForFamily } from "../../coin-modules/registry";
import type Transport from "@ledgerhq/hw-transport";
import type { RunOnTransport } from "../../coin-modules/types";
import { shouldUseGenericCoinFrameworkBridge } from "../../bridge/impl";
import getAddress from "../../hw/getAddress";
import { recordDerivedLegacyHints } from "./derivedLegacyHints";

/** Runs a device job on a transport of the session. */
export type RunDeviceJob = <T>(job: (transport: Transport) => Observable<T>) => Observable<T>;
import { LegacyDeriveUnsupportedError } from "./errors";
import { deriveAddressWithPublicKey } from "./deriveAddress";
import { onSession, type DeviceSession } from "./session";

export type { DeviceSession };

/** An aborted derivation rejects only once its device call settles, so the next one finds the device free. */
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

// An app too old for the path ends its mode, as Celo's legacy scan does; by name, as errors cross processes.
const isUpdateYourApp = (error: unknown) =>
  typeof error === "object" && error !== null && "name" in error && error.name === "UpdateYourApp";

/** Derives a candidate with the family's resolver or its own derivation, as `scanAccounts` would; an abort rejects once the device answered. */
export function deriveOnTransport(runDeviceJob: RunDeviceJob): DeriveAccount {
  // A runner per mode (its signal): what a family caches per runner lives one mode of one scan.
  const runners = new WeakMap<AbortSignal, RunOnTransport>();
  const seedIdentifiers = new WeakMap<AbortSignal, Map<string, Promise<string | undefined>>>();
  const runnerOf = (signal: AbortSignal): RunOnTransport => {
    const runner: RunOnTransport =
      runners.get(signal) ?? (job => runDeviceJob(transport => job(transport, signal)));
    runners.set(signal, runner);
    return runner;
  };
  return async (candidate, signal) => {
    const currency = getCryptoCurrencyById(currencyIdFromNetwork(candidate.network));
    const { family } = currency;
    const setup = await loadSetupForFamily(family);
    let derivedPublicKey: string | undefined;
    let derivedAddress: string | undefined;
    const derive = (): Observable<AccountDescriptor | LookedUpAccount | null> => {
      if (setup.deriveAccountDescriptor) {
        return setup.deriveAccountDescriptor(runnerOf(signal), currency, candidate);
      }
      if (getAccountDescriptorType(family) !== "address") {
        throw new LegacyDeriveUnsupportedError(`${family} has no deriveAccountDescriptor`);
      }
      return deriveAddressWithPublicKey(runnerOf(signal), candidate).pipe(
        map(({ descriptor, address, publicKey }) => {
          derivedAddress = address;
          derivedPublicKey = publicKey;
          return descriptor;
        }),
      );
    };
    const result = await settledThenAborted(defer(derive), signal).catch((error: unknown) => {
      if (isUpdateYourApp(error)) return null;
      throw error;
    });
    if (!result) return result;

    const descriptor = "descriptor" in result ? result.descriptor : result;
    const derivationMode = asDerivationMode(candidate.derivationMode);
    const seedPath = getSeedIdentifierDerivation(currency, derivationMode);
    // Casper's generic signer exposes the algorithm-tagged address as its publicKey, so seedIdentifier uses address.
    const useAddressAsSeed =
      currency.family === "casper" && shouldUseGenericCoinFrameworkBridge(currency.family);
    const derivedSeed = useAddressAsSeed ? derivedAddress : derivedPublicKey;
    let seedCache = seedIdentifiers.get(signal);
    if (!seedCache) {
      seedCache = new Map();
      seedIdentifiers.set(signal, seedCache);
    }
    const seedKey = `${currency.id}:${derivationMode}`;
    let seedIdentifierPromise = seedCache.get(seedKey);
    if (!seedIdentifierPromise) {
      if (derivedSeed !== undefined && fromDescriptorPath(candidate.addressPath) === seedPath) {
        seedIdentifierPromise = Promise.resolve(derivedSeed);
      } else {
        const readSeed = async (): Promise<string | undefined> => {
          const res = await settledThenAborted(
            defer(() =>
              runnerOf(signal)(transport =>
                from(
                  Promise.resolve(
                    getAddress(transport, { currency, path: seedPath, derivationMode }),
                  ),
                ),
              ),
            ),
            signal,
          );
          return useAddressAsSeed ? res?.address : res?.publicKey;
        };
        const cache = seedCache;
        seedIdentifierPromise = readSeed().catch((error: unknown) => {
          cache.delete(seedKey);
          throw error;
        });
      }
      seedCache.set(seedKey, seedIdentifierPromise);
    }
    const seedIdentifier = await seedIdentifierPromise;
    recordDerivedLegacyHints(descriptor, {
      seedIdentifier,
      publicKey: useAddressAsSeed ? derivedAddress : derivedPublicKey,
      address: derivedAddress,
    });
    return result;
  };
}

/** Derives on a Device Intent job's session, a transport per derivation so an aborted call never blocks the next. */
export function deriveOnSession(session: DeviceSession): DeriveAccount {
  const derive = deriveOnTransport(job =>
    defer(() => job(new DmkCompatTransport(session.dmk, session.sessionId))),
  );
  // The derivation checks its signal once it has the session: one stopped while queued never calls the device.
  return (candidate, signal) => onSession(session, () => derive(candidate, signal));
}
