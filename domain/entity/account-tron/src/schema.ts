import { z } from "zod";
import { AccountUUIDSchema } from "@domain/entity-account-descriptor";
import { AmountStrSchema } from "@domain/entity-account-balance";

/** Bandwidth points of the day: the free allowance and what frozen TRX gained, each with its use. */
export const TronBandwidthSchema = z.object({
  freeUsed: AmountStrSchema,
  freeLimit: AmountStrSchema,
  gainedUsed: AmountStrSchema,
  gainedLimit: AmountStrSchema,
});

export type TronBandwidth = z.infer<typeof TronBandwidthSchema>;

/** The network resources of a Tron account, as its account page shows them. */
export const TronResourcesSchema = z.object({
  /** Energy points left, an integer. */
  energy: AmountStrSchema,
  bandwidth: TronBandwidthSchema,
  /** Votes the account can cast: one per frozen TRX. */
  tronPower: z.number().int().nonnegative(),
});

export type TronResources = z.infer<typeof TronResourcesSchema>;

export const AccountTronEntrySchema = z.object({
  revision: z.number(),
  resources: TronResourcesSchema,
});

export type AccountTronEntry = z.infer<typeof AccountTronEntrySchema>;

export const AccountTronStateSchema = z.partialRecord(AccountUUIDSchema, AccountTronEntrySchema);

export type AccountTronState = z.infer<typeof AccountTronStateSchema>;

export const initialAccountTronState: AccountTronState = {};

declare module "@domain/entity-account-data" {
  interface AccountDataRegistry {
    /** Energy, bandwidth and Tron power; frozen TRX is in the `balance` kind's `locked`. */
    "tron:resources": { query: undefined; result: TronResources };
  }
}
