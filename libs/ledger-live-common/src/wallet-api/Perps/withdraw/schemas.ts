import BigNumber from "bignumber.js";
import { z } from "zod";

// TODO(LIVE-39366): placeholder shapes, align with the real SwapKit responses.

// Strings only: JSON numbers are already rounded by JavaScript before BigNumber reads them.
export const DecimalSchema = z
  .string()
  .regex(/^\d+(\.\d+)?$/, "Expected a decimal string")
  .transform(value => new BigNumber(value));

const TypedDataSchema = z.looseObject({
  domain: z.record(z.string(), z.unknown()),
  types: z.record(z.string(), z.array(z.looseObject({ name: z.string(), type: z.string() }))),
  primaryType: z.string(),
  message: z.record(z.string(), z.unknown()),
});
export type WithdrawTypedData = z.infer<typeof TypedDataSchema>;

const MayanPayloadSchema = z.looseObject({
  swapId: z.string().optional(),
  typedData: TypedDataSchema,
});

const NearPayloadSchema = z.looseObject({
  swapId: z.string().optional(),
  hyperCoreAction: z.looseObject({ typedData: TypedDataSchema }),
});

// Loose objects keep unknown fields so the payload is resubmitted unmodified.
export const WithdrawPayloadSchema = z.union([NearPayloadSchema, MayanPayloadSchema]);
export type WithdrawPayload = z.infer<typeof WithdrawPayloadSchema>;

export function getWithdrawTypedData(payload: WithdrawPayload): WithdrawTypedData {
  const near = NearPayloadSchema.safeParse(payload);
  if (near.success) return near.data.hyperCoreAction.typedData;
  return MayanPayloadSchema.parse(payload).typedData;
}

export const WithdrawSubmitResultSchema = z.object({
  swapId: z.string(),
});
export type WithdrawSubmitResult = z.infer<typeof WithdrawSubmitResultSchema>;
