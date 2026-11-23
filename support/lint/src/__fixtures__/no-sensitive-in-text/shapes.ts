import type { AccountDescriptor, AccountKey } from "./schema";

declare function log(type: string, message: string, data?: unknown): void;
type Holder = { key: AccountKey };
declare const shared: { deep: { a: { b: { c: { d: { e: Holder } } } } }; holder: Holder };
declare const keys: Record<string, AccountKey>;
declare const descriptors: Record<string, AccountDescriptor>;

log("sync", "shared", shared);
log("sync", "keys", keys);
log("sync", "descriptors", descriptors);

declare const DdLogs: { error(message: string, context?: unknown): void };
declare const datadogLogs: { logger: { info(message: string, context?: unknown): void } };
declare const errors: { SyncError: new (message: string) => Error };
DdLogs.error("sync", { key: descriptors.a?.key });
datadogLogs.logger.info(`sync ${keys.a}`);
export const thrown = new errors.SyncError(keys.a);
