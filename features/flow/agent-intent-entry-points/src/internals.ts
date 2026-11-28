import type { Feature, Features } from "@shared/feature-flags";

type AgentIntentFlagParams = NonNullable<Features["agentIntent"]["params"]>;

export type AgentIntentFlag = Feature<AgentIntentFlagParams> | null | undefined;
