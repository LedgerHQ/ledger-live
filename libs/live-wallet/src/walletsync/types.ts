import { Account, AccountBridge, BridgeCacheSystem, TransactionCommon } from "@ledgerhq/types-live";
import { ZodType, z } from "zod";

/**
 * WalletSyncDataManager is a module that is responsible for managing the reconciliation of incremental data updates.
 *
 * Glossary:
 *
 * LocalState = All the data that the client has locally that the module needs as an input for the reconciliation.
 * Update = an action payload to express the update mutation that you need to do on the local state after determining an update to do with distant state changes.
 * Schema = the Schema is a Zod type that allows to validate the data that this module will store in cloud sync data. the `typeof schema`. IMPORTANT: the schema must not change over time.
 * DistantState = the type that correspond to the Schema. Basically the exact data that we store in cloud sync for that module. (NB: it is automatically inferred from the Schema)
 */
export interface WalletSyncDataManager<
  LocalState,
  Update,
  Schema extends ZodType,
  DistantState = z.infer<Schema>,
> {
  schema: Schema;

  /**
   * Synchronously calculate if we have new DistantState data to push. Assuming localData is up to date with wallet sync, we infer what could possibly be a new update to push.
   */
  diffLocalToDistant: (
    localData: LocalState,
    latestState: DistantState | null,
  ) => DistantDiff<DistantState>;

  /**
   * Asynchronously accept new DistantState data and determine the potential Update to do on the local state
   */
  resolveIncomingDistantState: (
    ctx: WalletSyncDataManagerResolutionContext,
    localData: LocalState,
    latestState: DistantState | null,
    incomingState: DistantState,
  ) => Promise<UpdateDiff<Update>>;

  /**
   * This provide the implementation to apply an update on top of a LocalState and synchronously calculate the new state. NB: this is agnostic of the way you store the "LocalState" itself, feel free to remap/convert the data to your own store format.
   */
  applyUpdate: (localData: LocalState, update: Update) => LocalState;
}

/**
 * this provide the implementations needed by modules to be integrated at the final projects. This is typically because this library is independant from live-common and this context have all the necessary dependencies. Feel free to evolve and adds what modules need to resolve information. (Also note that LLD/LLM will have different implementations, for instance different backends for bridgeCache)
 */
export type WalletSyncDataManagerResolutionContext = {
  getAccountBridge: <T extends TransactionCommon>(account: Account) => AccountBridge<T>;
  bridgeCache: BridgeCacheSystem;
  blacklistedTokenIds?: string[];
};

/**
 * this type wrap the update to apply to the local state. it can be empty if there is no update to do.
 */
export type UpdateDiff<Update> =
  | {
      hasChanges: false;
    }
  | {
      hasChanges: true;
      update: Update;
    };

/**
 * this type wrap the distant state diff. it can be empty if there is no changes.
 */
export type DistantDiff<DistantState> = {
  hasChanges: boolean;
  nextState: DistantState;
};

// utility types

export type ExtractLocalState<T> = T extends WalletSyncDataManager<infer L, any, any> ? L : never;

export type ExtractUpdateEvent<T> = T extends WalletSyncDataManager<any, infer U, any> ? U : never;

export type ExtractSchema<T> = T extends WalletSyncDataManager<any, any, infer S> ? S : never;
