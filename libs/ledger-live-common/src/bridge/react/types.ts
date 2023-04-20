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
    };
export type SyncState = {
  pending: boolean;
  error: Error | null | undefined;
};
export type BridgeSyncState = Record<string, SyncState>;
// trigger an action
export type Sync = (action: SyncAction) => void;
