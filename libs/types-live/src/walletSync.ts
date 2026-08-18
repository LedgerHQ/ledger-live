export type WalletSyncEnvironment = "STAGING" | "PROD";

export type WalletSyncWatchConfig = {
  notificationsEnabled?: boolean;
  pollingInterval?: number;
  initialTimeout?: number;
  userIntentDebounce?: number;
};
