import { DateTimeIsoSchema } from "@shared/schema-primitives";
import { z } from "zod";
import {
  AGENT_PROFILE_DESCRIPTION_MAX_LENGTH,
  AGENT_PROFILE_NAME_MAX_LENGTH,
  AGENT_PROFILE_SOURCE_MAX_LENGTH,
} from "./constants";
import {
  AGENT_INTENT_ERROR_TYPES,
  AGENT_INTENT_PAGE_SIZES,
  AGENT_INTENT_STATUSES,
  type AgentIntentCraft as SdkAgentIntentCraft,
  type AgentIntentRecord as SdkAgentIntentRecord,
  type AgentIntentSignatureReceipt as SdkAgentIntentSignatureReceipt,
  type AgentIntentStats as SdkAgentIntentStats,
  type AgentProfileFields as SdkAgentProfileFields,
  type AgentProfileRecord as SdkAgentProfileRecord,
  type AgentProfileUpdate as SdkAgentProfileUpdate,
} from "./internals/agentIntentSdk";

export const AgentIntentIdSchema = z.uuid().brand<"AgentIntentId">();

export const AgentPubkeySchema = z.string().min(1).brand<"AgentPubkey">();

export const AgentIntentStatusSchema = z.enum(AGENT_INTENT_STATUSES);

export const AgentIntentRecordStatusSchema = z.union([
  AgentIntentStatusSchema,
  z.string().min(1).brand<"UnknownAgentIntentStatus">(),
]);

export const AgentIntentPageSizeSchema = z.literal(AGENT_INTENT_PAGE_SIZES);

export const AgentIntentErrorTypeSchema = z.enum(AGENT_INTENT_ERROR_TYPES);

export const AgentIntentAssetSchema = z.object({
  type: z.string().min(1),
  assetReference: z.string().min(1).optional(),
  assetOwner: z.string().min(1).optional(),
});

/** `amount` is in the asset's smallest unit (wei, lamports, token base units). */
export const AgentIntentSendOperationSchema = z.object({
  type: z.literal("send"),
  network: z.string().min(1),
  sender: z.string().min(1),
  recipient: z.string().min(1),
  amount: z.string().regex(/^\d+$/, "Expected an integer amount in the asset's smallest unit"),
  asset: AgentIntentAssetSchema,
  feeStrategy: z.string().min(1).optional(),
  memo: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
});

const POSITIVE_DECIMAL = /^(?!0(?:\.0+)?$)(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/;

/** Amounts are in the assets' human units, as the agent signed them. */
export const AgentIntentSwapOperationSchema = z.object({
  type: z.literal("swap"),
  network: z.string().min(1),
  sender: z.string().min(1),
  fromAsset: z.string().min(1),
  toAsset: z.string().min(1),
  fromAmount: z.string().regex(POSITIVE_DECIMAL, "Expected a positive decimal amount"),
  toAmount: z.string().regex(POSITIVE_DECIMAL, "Expected a positive decimal amount"),
  provider: z.string().min(1),
  description: z.string().min(1).optional(),
});

const KNOWN_OPERATION_TYPES: ReadonlySet<string> = new Set([
  AgentIntentSendOperationSchema.shape.type.value,
  AgentIntentSwapOperationSchema.shape.type.value,
]);

export const AgentIntentUnknownOperationSchema = z.union([
  z.object({ type: z.literal("unknown"), receivedType: z.string().min(1) }),
  z
    .looseObject({
      type: z
        .string()
        .min(1)
        .refine(
          type => !KNOWN_OPERATION_TYPES.has(type),
          "Expected an intent type other than send or swap",
        ),
    })
    .transform(operation => ({ type: "unknown" as const, receivedType: operation.type })),
]);

export const AgentIntentOperationSchema = z.union([
  AgentIntentSendOperationSchema,
  AgentIntentSwapOperationSchema,
  AgentIntentUnknownOperationSchema,
]);

export const AgentIntentContextSchema = z.object({
  transactionId: z.string().min(1).optional(),
});

export const AgentIntentRecordSchema = z.object({
  id: AgentIntentIdSchema,
  agentPubkey: AgentPubkeySchema,
  status: AgentIntentRecordStatusSchema,
  intent: AgentIntentOperationSchema,
  createdAt: DateTimeIsoSchema,
  updatedAt: DateTimeIsoSchema,
  failureReason: z.string().min(1).optional(),
  context: AgentIntentContextSchema.optional(),
}) satisfies z.ZodType<SdkAgentIntentRecord>;

export const AgentIntentStatsSchema = z.object({
  total: z.int().nonnegative(),
  approved: z.int().nonnegative(),
  rejected: z.int().nonnegative(),
}) satisfies z.ZodType<SdkAgentIntentStats>;

const EVM_RAW_TRANSACTION = /^0x(?:[0-9a-fA-F]{2})+$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/** A Solana wire transaction in base64 can't start with "0x": its first byte would be 0xD3. */
export const AgentIntentRawTransactionSchema = z
  .string()
  .min(1)
  .refine(
    raw => (raw.startsWith("0x") ? EVM_RAW_TRANSACTION.test(raw) : BASE64.test(raw)),
    "Expected 0x-prefixed hex (EVM) or base64 (Solana)",
  )
  .brand<"AgentIntentRawTransaction">();

export const AgentIntentRevisionSchema = z.int().min(1);

export const AgentIntentCraftSchema = z.object({
  rawTransaction: AgentIntentRawTransactionSchema,
  revision: AgentIntentRevisionSchema,
  details: z.record(z.string(), z.unknown()).optional(),
}) satisfies z.ZodType<SdkAgentIntentCraft>;

/** The BFF broadcasts any non-empty signature, so a malformed one could fail the intent. */
export const AgentIntentSignatureSchema = z
  .string()
  .regex(
    /^(?:0x[0-9a-f]{128}(?:1b|1c)|[0-9a-f]{128})$/,
    "Expected lowercase hex: 0x + r‖s‖v with v 1b or 1c (EVM), or 64 bytes without 0x (Solana)",
  )
  .brand<"AgentIntentSignature">();

export const AgentIntentSignatureReceiptSchema = z.object({
  transactionId: z.string().min(1),
}) satisfies z.ZodType<SdkAgentIntentSignatureReceipt>;

export const AgentProfileFieldsSchema = z.object({
  name: z.string(),
  description: z.string(),
  source: z.string(),
  iconRef: z.string().min(1).optional(),
}) satisfies z.ZodType<SdkAgentProfileFields>;

export const AgentProfileInputSchema = z.object({
  name: z.string().trim().min(1).max(AGENT_PROFILE_NAME_MAX_LENGTH),
  description: z.string().trim().min(1).max(AGENT_PROFILE_DESCRIPTION_MAX_LENGTH),
  source: z.string().trim().min(1).max(AGENT_PROFILE_SOURCE_MAX_LENGTH),
  iconRef: z.string().min(1).optional(),
}) satisfies z.ZodType<SdkAgentProfileFields>;

export const AgentProfileUpdateSchema = AgentProfileInputSchema.partial().refine(
  update => Object.values(update).some(value => value !== undefined),
  "A profile update needs at least one field",
) satisfies z.ZodType<SdkAgentProfileUpdate>;

export const AgentProfileRecordSchema = z.object({
  agentPubkey: AgentPubkeySchema,
  profile: AgentProfileFieldsSchema,
  createdAt: DateTimeIsoSchema,
  updatedAt: DateTimeIsoSchema,
}) satisfies z.ZodType<SdkAgentProfileRecord>;
