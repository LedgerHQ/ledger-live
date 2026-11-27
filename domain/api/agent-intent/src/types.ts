import type {
  AgentIntentErrorType,
  AgentIntentRecord,
  AgentProfileRecord,
  AgentPubkey,
} from "@domain/entity-agent-intent";
import type { z } from "zod";
import type {
  AgentIntentListArgsSchema,
  AgentIntentSignatureSubmissionSchema,
  CreateAgentProfileArgsSchema,
  UpdateAgentProfileArgsSchema,
} from "./schema";

export type AgentIntentListArgs = z.infer<typeof AgentIntentListArgsSchema>;
export type AgentIntentStatsArgs = { agentPubkey?: AgentPubkey } | void;
export type AgentIntentSignatureSubmission = z.infer<typeof AgentIntentSignatureSubmissionSchema>;
export type CreateAgentProfileArgs = z.infer<typeof CreateAgentProfileArgsSchema>;
export type UpdateAgentProfileArgs = z.infer<typeof UpdateAgentProfileArgsSchema>;

export type UnreadableRecord = { id?: string; issues: string };

export type AgentIntentPage = {
  intents: AgentIntentRecord[];
  nextCursor?: string;
  unreadable: UnreadableRecord[];
};

export type AgentProfileList = {
  profiles: AgentProfileRecord[];
  unreadable: UnreadableRecord[];
};

export type AgentIntentFailure =
  | { kind: "http"; status: number; type?: AgentIntentErrorType; message?: string }
  | { kind: "unreadable-response" }
  | { kind: "invalid-request"; issues: string }
  | { kind: "network" }
  | { kind: "unknown"; message?: string };
