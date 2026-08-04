export type WSState = { data: Record<string, unknown> | null; version: number };

export type WalletSyncState = {
  walletSyncState: WSState;
};

export const initialWalletSyncState: WalletSyncState = {
  walletSyncState: { data: null, version: 0 },
};

export type ExportedWalletSyncState = WalletSyncState;
