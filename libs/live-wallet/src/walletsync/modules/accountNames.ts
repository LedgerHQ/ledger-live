/**
 * @module accountNames
 *
 * Deprecated: compatibility shim. The implementation now lives in
 * @domain/entity-account-name (accountNamesSyncModule), this only re-shapes it
 * to the legacy ctx-carrying WalletSyncDataManager interface.
 */
import { accountNamesSyncModule } from "@domain/entity-account-name";
import { ignoreCtx } from "../ctx";

export default ignoreCtx(accountNamesSyncModule);
