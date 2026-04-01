import { z } from "zod";

export const CheckpointSchema = z.object({
  height: z.number().int().positive(),
  expectedShieldedBalance: z.string().optional(),
  expectedTransparentBalance: z.string().optional(),
  expectedAvailableBalance: z.string().optional(),
  expectedOperationsCount: z.number().int().nonnegative().optional(),
  expectedShieldedTxCount: z.number().int().nonnegative().optional(),
  comment: z.string().optional(),
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;

export const GoldenAccountSchema = z.object({
  label: z.string(),
  ufvkFingerprint: z.string(),
  birthHeight: z.number().int().nonnegative(),
  network: z.enum(["mainnet", "testnet"]),
  checkpoints: z.array(CheckpointSchema),
});
export type GoldenAccount = z.infer<typeof GoldenAccountSchema>;

export const GoldenValuesSchema = z.object({
  accounts: z.array(GoldenAccountSchema),
});
export type GoldenValues = z.infer<typeof GoldenValuesSchema>;
