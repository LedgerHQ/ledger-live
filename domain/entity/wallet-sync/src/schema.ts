import { z } from "zod";

export const WalletSyncEnvironmentSchema = z.enum(["STAGING", "PROD"]);

export type WalletSyncEnvironment = z.infer<typeof WalletSyncEnvironmentSchema>;

export const WSStateSchema = z.object({
  data: z.record(z.string(), z.unknown()).nullable(),
  version: z.number(),
  environment: WalletSyncEnvironmentSchema.optional(),
});

export type WSState = z.infer<typeof WSStateSchema>;

export const WalletSyncStateSchema = z.object({
  walletSyncState: WSStateSchema,
  isHydrated: z.boolean().optional(),
});

export type WalletSyncState = z.infer<typeof WalletSyncStateSchema>;

export const initialWalletSyncState: WalletSyncState = {
  walletSyncState: { data: null, version: 0 },
  isHydrated: false,
};
