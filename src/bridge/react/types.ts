export type SyncAction =
  | {
      type: "BACKGROUND_TICK";
    }
  | {
      type: "SET_SKIP_UNDER_PRIORITY";
      priority: number;
    }
  | {
      type: "SYNC_ONE_ACCOUNT";
      accountId: string;
      priority: number;
    }
  | {
      type: "SYNC_SOME_ACCOUNTS";
      accountIds: string[];
      priority: number;
    }
  | {
      type: "SYNC_ALL_ACCOUNTS";
      priority: number;
    };
export type SyncState = {
  pending: boolean;
  error: Error | null | undefined;
};
export type BridgeSyncState = Record<string, SyncState>;
// trigger an action
export type Sync = (action: SyncAction) => void;
