import BigNumber from "bignumber.js";
import { z } from "zod";

// Strings only: JSON numbers are already rounded by JavaScript before BigNumber reads them.
export const DecimalSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Expected a decimal string")
  .transform(value => new BigNumber(value));

const TypesSchema = z.record(
  z.string(),
  z.array(z.looseObject({ name: z.string(), type: z.string() })),
);
const RecordSchema = z.record(z.string(), z.unknown());

// NEAR route: a Hyperliquid action and its standard EIP-712 typed data.
const NearPayloadSchema = z.object({
  swapId: z.string(),
  hyperCoreAction: z.looseObject({
    typedData: z.looseObject({
      domain: RecordSchema,
      types: TypesSchema,
      primaryType: z.string(),
      message: RecordSchema,
    }),
  }),
});

// Mayan route: ethers' signTypedData(domain, types, value), so no primaryType.
const MayanPayloadSchema = z.object({
  swapId: z.string(),
  typedData: z.looseObject({ domain: RecordSchema, types: TypesSchema, value: RecordSchema }),
});

export const WithdrawPayloadSchema = z.union([NearPayloadSchema, MayanPayloadSchema]);
export type WithdrawPayload = z.infer<typeof WithdrawPayloadSchema>;

export const WithdrawSubmitResultSchema = z.object({
  swapId: z.string(),
});
export type WithdrawSubmitResult = z.infer<typeof WithdrawSubmitResultSchema>;
