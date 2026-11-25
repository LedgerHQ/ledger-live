import { DdRum, ErrorSource } from "@datadog/mobile-react-native";
import {
  createPersistence,
  describePersistenceFailure,
  keyPerEntry,
  type PersistenceBinding,
  type PersistenceFailure,
  type WriteStrategy,
} from "@features/platform-persistence";
import { createMmkvStorage } from "@shared/storage-mmkv";
import type { State } from "~/reducers/types";
import { accountsRecord } from "./records/accounts";
import { historyRecord } from "./records/history";
import { marketBannerRecord } from "./records/marketBanner";
import { withReadRetry } from "./withReadRetry";

/** The throttle of the legacy `useDBSaveEffect`. */
const LEGACY_WRITE_STRATEGY: WriteStrategy = { throttleMs: 500 };

const BINDINGS: ReadonlyArray<PersistenceBinding<State>> = [
  { record: historyRecord, strategy: LEGACY_WRITE_STRATEGY },
  { record: marketBannerRecord, strategy: LEGACY_WRITE_STRATEGY },
  {
    record: accountsRecord,
    keyScheme: keyPerEntry({ prefix: "accounts.active.", orderKey: "accounts.sort" }),
    strategy: LEGACY_WRITE_STRATEGY,
  },
];

/** A newer version comes back after a downgrade: expected, so a warning, not a Datadog error. */
const report = (failure: PersistenceFailure) => {
  const message = describePersistenceFailure(failure);
  console.warn(message);
  if (failure.operation === "newer") return;
  // Not ~/datadog: it imports the store, which imports this module. The SDK buffers the error
  // until it starts, and drops it when Datadog is off.
  DdRum.addError(message, ErrorSource.SOURCE, "");
};

/**
 * Persistence reads MMKV only: an install still on AsyncStorage keeps the legacy code. The reads
 * retry as the legacy start reads do (`LedgerStore`): 3 more tries, 500 ms apart.
 */
export const persistence = createPersistence<State>({
  storage: withReadRetry(createMmkvStorage(), { retries: 3, delayMs: 500 }),
  bindings: BINDINGS,
  report,
});
