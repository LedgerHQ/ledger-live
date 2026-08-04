/**
 * @module recentAddresses
 *
 * Deprecated: compatibility shim. The implementation now lives in
 * @domain/entity-recent-addresses (recentAddressesSyncModule), this only re-shapes it
 * to the legacy ctx-carrying WalletSyncDataManager interface.
 */
import { recentAddressesSyncModule } from "@domain/entity-recent-addresses";
import { ignoreCtx } from "../ctx";

export type { DistantRecentAddressesState } from "@domain/entity-recent-addresses";
export { toDistantState, toState } from "@domain/entity-recent-addresses";

export default ignoreCtx(recentAddressesSyncModule);
