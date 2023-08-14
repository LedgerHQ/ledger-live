import { AccountDescriptor } from "../../cross";

export type WalletSyncInferredActions = {
  addedAccounts: AccountDescriptor[];
  removedAccounts: AccountDescriptor[];
  updatedAccounts: AccountDescriptor[];
};

export type UpdatesInput = {
  type: "SYNC_WITH_WALLET_SYNC";
  actions: WalletSyncInferredActions;
  onSuccess: (_: UnimportedAccountDescriptors) => void;
};

export type SyncAction =
  | {
      type: "BACKGROUND_TICK";
      reason: string;
    }
  | {
      type: "SET_SKIP_UNDER_PRIORITY";
      priority: number;
    }
  | {
      type: "SYNC_ONE_ACCOUNT";
      accountId: string;
      priority: number;
      reason?: string;
    }
  | {
      type: "SYNC_SOME_ACCOUNTS";
      accountIds: string[];
      priority: number;
      reason: string;
    }
  | {
      type: "SYNC_ALL_ACCOUNTS";
      priority: number;
      reason: string;
    }
  | UpdatesInput;
export type SyncState = {
  pending: boolean;
  error: Error | null | undefined;
};
export type BridgeSyncState = Record<string, SyncState>;
// trigger an action
export type Sync = (action: SyncAction) => void;

export type UnimportedAccountDescriptors = Array<{
  descriptor: AccountDescriptor;
  error: string;
}>;

export type WalletSyncPayload = AccountDescriptor[];

export type UpdatesQueue = {
  push: (input: UpdatesInput) => void;
  idle: () => boolean;
};
