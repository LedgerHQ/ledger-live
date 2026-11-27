import type { z } from "zod";
import type {
  AgentIntentAssetSchema,
  AgentIntentContextSchema,
  AgentIntentCraftSchema,
  AgentIntentErrorTypeSchema,
  AgentIntentIdSchema,
  AgentIntentOperationSchema,
  AgentIntentPageSizeSchema,
  AgentIntentRawTransactionSchema,
  AgentIntentRecordSchema,
  AgentIntentRecordStatusSchema,
  AgentIntentRevisionSchema,
  AgentIntentSendOperationSchema,
  AgentIntentSignatureReceiptSchema,
  AgentIntentSignatureSchema,
  AgentIntentStatsSchema,
  AgentIntentStatusSchema,
  AgentIntentSwapOperationSchema,
  AgentIntentUnknownOperationSchema,
  AgentProfileFieldsSchema,
  AgentProfileInputSchema,
  AgentProfileRecordSchema,
  AgentProfileUpdateSchema,
  AgentPubkeySchema,
} from "./schema";

export type AgentIntentId = z.infer<typeof AgentIntentIdSchema>;
export type AgentPubkey = z.infer<typeof AgentPubkeySchema>;
export type AgentIntentStatus = z.infer<typeof AgentIntentStatusSchema>;
export type AgentIntentRecordStatus = z.infer<typeof AgentIntentRecordStatusSchema>;
export type AgentIntentPageSize = z.infer<typeof AgentIntentPageSizeSchema>;
export type AgentIntentErrorType = z.infer<typeof AgentIntentErrorTypeSchema>;
export type AgentIntentAsset = z.infer<typeof AgentIntentAssetSchema>;
export type AgentIntentSendOperation = z.infer<typeof AgentIntentSendOperationSchema>;
export type AgentIntentSwapOperation = z.infer<typeof AgentIntentSwapOperationSchema>;
export type AgentIntentUnknownOperation = z.infer<typeof AgentIntentUnknownOperationSchema>;
export type AgentIntentOperation = z.infer<typeof AgentIntentOperationSchema>;
export type AgentIntentContext = z.infer<typeof AgentIntentContextSchema>;
export type AgentIntentRecord = z.infer<typeof AgentIntentRecordSchema>;
export type AgentIntentStats = z.infer<typeof AgentIntentStatsSchema>;
export type AgentIntentRawTransaction = z.infer<typeof AgentIntentRawTransactionSchema>;
export type AgentIntentRevision = z.infer<typeof AgentIntentRevisionSchema>;
export type AgentIntentCraft = z.infer<typeof AgentIntentCraftSchema>;
export type AgentIntentSignature = z.infer<typeof AgentIntentSignatureSchema>;
export type AgentIntentSignatureReceipt = z.infer<typeof AgentIntentSignatureReceiptSchema>;
export type AgentProfileFields = z.infer<typeof AgentProfileFieldsSchema>;
export type AgentProfileInput = z.infer<typeof AgentProfileInputSchema>;
export type AgentProfileUpdate = z.infer<typeof AgentProfileUpdateSchema>;
export type AgentProfileRecord = z.infer<typeof AgentProfileRecordSchema>;
