import { z } from "zod";

/** One validator a network offers for staking, as the screens show it. */
export const NetworkValidatorSchema = z.object({
  /** What staking positions refer to: the validator address on Cosmos. */
  id: z.string().min(1),
  name: z.string(),
  address: z.string().min(1).optional(),
  /** The share of rewards the validator keeps, from 0 to 1. */
  commission: z.number().min(0).max(1).optional(),
  /** The estimated yearly yield, 0.1 for 10%. */
  apy: z.number().min(0).optional(),
  /** What is staked with the validator, an integer in the smallest unit of the network's coin. */
  totalStaked: z
    .string()
    .regex(/^\d+$/, "totalStaked must be a non-negative integer string")
    .optional(),
  iconUrl: z.string().url().optional(),
  url: z.string().url().optional(),
});

export type NetworkValidator = z.infer<typeof NetworkValidatorSchema>;

export const NetworkValidatorsErrorSchema = z.object({ name: z.string(), message: z.string() });

export type NetworkValidatorsError = z.infer<typeof NetworkValidatorsErrorSchema>;

/** A network's validators, and how their last read went. */
export type NetworkValidatorsEntry = {
  validators: NetworkValidator[];
  /** When the stored validators were read; absent before the first answer. */
  receivedAt?: number;
  /** The read in flight: only its answer is stored. */
  pending?: { requestId: string };
  /** The last read's error; the validators stored before it are kept. */
  error?: NetworkValidatorsError;
};
