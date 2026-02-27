import { DatadogId } from "@ledgerhq/client-ids/ids";
import { isDummyDatadogId } from "@ledgerhq/client-ids/store";
import sentry from "~/sentry/main";
import { initDatadogMain } from "~/datadog/main";
import type { User } from "~/renderer/storage";

export type IdentitiesFromDb =
  | { datadogId?: string; userId?: string; deviceIds?: string[] }
  | undefined;

/** User as persisted in db may include datadogId (legacy or migrated). */
export type UserFromDb = User & { datadogId?: string };

/**
 * Initialize Sentry and Datadog main using datadogId (same id as renderer).
 * Called from main process app.ready after reading user, identities from db.
 * IDs from persistence are boxed immediately; export methods are called only at the boundary.
 * getShouldSend must return the current sentryLogs value (e.g. from a cache updated on setKey)
 * so that opt-out is respected when the user toggles the setting later.
 */
export function initSentryAndDatadogFromDb(
  getShouldSend: () => boolean,
  user: UserFromDb | null | undefined,
  identities: IdentitiesFromDb,
): void {
  const datadogIdRaw = identities?.datadogId ?? user?.datadogId;
  const datadogId = datadogIdRaw ? DatadogId.fromString(datadogIdRaw) : null;

  if (datadogId && !isDummyDatadogId(datadogId)) {
    sentry(getShouldSend, datadogId.exportDatadogIdForSentry());
    initDatadogMain(getShouldSend, datadogId.exportDatadogIdForRumUser());
  }
}
