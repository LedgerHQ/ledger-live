import { z } from "zod";

/**
 * Blockchain explorer URL templates for a crypto currency.
 * Each field is a URL pattern where `$hash` or `$address` is replaced at runtime.
 */
export const ExplorerViewSchema = z.object({
  /** Transaction detail URL (e.g. `"https://blockstream.info/tx/$hash"`). */
  tx: z.string().optional(),
  /** Address detail URL (e.g. `"https://blockstream.info/address/$address"`). */
  address: z.string().optional(),
  /** Token detail URL. */
  token: z.string().optional(),
  /** Stake pool detail URL. */
  stakePool: z.string().optional(),
});
