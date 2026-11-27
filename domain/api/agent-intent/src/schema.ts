import {
  AgentIntentIdSchema,
  AgentIntentPageSizeSchema,
  AgentIntentRevisionSchema,
  AgentIntentSignatureSchema,
  AgentIntentStatusSchema,
  AgentProfileInputSchema,
  AgentProfileUpdateSchema,
  AgentPubkeySchema,
} from "@domain/entity-agent-intent";
import { z } from "zod";

/** RTK Query wants an argument schema whose input is the argument type, branded values included. */
function alreadyParsed<Schema extends z.ZodType>(schema: Schema) {
  return z.custom<z.output<Schema>>(value => schema.safeParse(value).success);
}

export const AgentIntentIdArgSchema = alreadyParsed(AgentIntentIdSchema);
export const AgentPubkeyArgSchema = alreadyParsed(AgentPubkeySchema);

export const AgentIntentListArgsSchema = z.object({
  status: z.array(AgentIntentStatusSchema).min(1).optional(),
  pageSize: AgentIntentPageSizeSchema.optional(),
  agentPubkey: AgentPubkeyArgSchema.optional(),
});

export const AgentIntentListPageRequestSchema = z.object({
  queryArg: AgentIntentListArgsSchema,
  pageParam: z.string().min(1).nullable(),
});

export const AgentIntentSignatureSubmissionSchema = z.object({
  intentId: AgentIntentIdArgSchema,
  signature: alreadyParsed(AgentIntentSignatureSchema),
  revision: AgentIntentRevisionSchema,
});

export const CreateAgentProfileArgsSchema = z.object({
  agentPubkey: AgentPubkeyArgSchema,
  profile: AgentProfileInputSchema,
});

export const UpdateAgentProfileArgsSchema = z.object({
  agentPubkey: AgentPubkeyArgSchema,
  update: AgentProfileUpdateSchema,
});

export const AgentIntentErrorBodySchema = z.object({
  message: z.string().min(1),
  type: z.string().min(1).nullish(),
});

/**
 * The BFF's missing-profile 404 has no `type` (BACK-13655), so only its message, the SDK's
 * `MISSING_PROFILE_MESSAGE`, tells it from a gateway's 404.
 */
export const MissingAgentProfileBodySchema = z.object({
  message: z.literal("Agent profile not found."),
});
