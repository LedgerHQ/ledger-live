import { z } from "zod";

export const WSStateSchema = z.object({
  data: z.record(z.string(), z.unknown()).nullable(),
  version: z.number(),
});

export type WSState = z.infer<typeof WSStateSchema>;

export const WalletSyncStateSchema = z.object({
  walletSyncState: WSStateSchema,
});

export type WalletSyncState = z.infer<typeof WalletSyncStateSchema>;

export const initialWalletSyncState: WalletSyncState = {
  walletSyncState: { data: null, version: 0 },
};
