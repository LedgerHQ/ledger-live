import type { Account } from "@ledgerhq/types-live";
import { createPerpsRequest } from "./perpsRequest";

/** Stays pending across the add account screens until settled or cancelled. */
const migrationRequest = createPerpsRequest<Account[]>();

export const beginMigrationRequest = migrationRequest.begin;
export const getMigrationRequestId = migrationRequest.getId;
export const settleMigrationRequest = migrationRequest.settle;
export const cancelMigrationRequest = migrationRequest.cancel;
