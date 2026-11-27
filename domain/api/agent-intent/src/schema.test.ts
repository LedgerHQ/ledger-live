import {
  AgentIntentIdSchema,
  AgentIntentSignatureSchema,
  AgentPubkeySchema,
} from "@domain/entity-agent-intent";
import {
  AgentIntentListArgsSchema,
  AgentIntentSignatureSubmissionSchema,
  CreateAgentProfileArgsSchema,
  MissingAgentProfileBodySchema,
  UpdateAgentProfileArgsSchema,
} from "./schema";

const intentId = AgentIntentIdSchema.parse("019ac3e2-5b7d-7c41-9a2e-3f6b8d0c1e24");
const agentPubkey = AgentPubkeySchema.parse("02a1b2");
const signature = AgentIntentSignatureSchema.parse("cd".repeat(64));

describe("AgentIntentListArgsSchema", () => {
  it("should accept no filter, and reject an empty status list or another page size", () => {
    expect(AgentIntentListArgsSchema.safeParse({}).success).toBe(true);
    expect(AgentIntentListArgsSchema.safeParse({ status: [] }).success).toBe(false);
    expect(AgentIntentListArgsSchema.safeParse({ pageSize: 20 }).success).toBe(false);
  });
});

describe("AgentIntentSignatureSubmissionSchema", () => {
  it("should accept parsed values and reject a signature that isn't one", () => {
    expect(
      AgentIntentSignatureSubmissionSchema.safeParse({ intentId, signature, revision: 1 }).success,
    ).toBe(true);
    expect(
      AgentIntentSignatureSubmissionSchema.safeParse({ intentId, signature: "0x12", revision: 1 })
        .success,
    ).toBe(false);
  });
});

describe("profile write arguments", () => {
  it("should trim the profile and reject an update without a field", () => {
    expect(
      CreateAgentProfileArgsSchema.parse({
        agentPubkey,
        profile: { name: " A ", description: "B", source: "C" },
      }).profile.name,
    ).toBe("A");
    expect(UpdateAgentProfileArgsSchema.safeParse({ agentPubkey, update: {} }).success).toBe(false);
  });

  it("should reject a key that could be read as a path", () => {
    expect(
      UpdateAgentProfileArgsSchema.safeParse({ agentPubkey: "..", update: { name: "A" } }).success,
    ).toBe(false);
  });
});

describe("MissingAgentProfileBodySchema", () => {
  it("should match only the BFF's missing-profile message", () => {
    expect(
      MissingAgentProfileBodySchema.safeParse({ message: "Agent profile not found." }).success,
    ).toBe(true);
    expect(MissingAgentProfileBodySchema.safeParse({ message: "Not Found" }).success).toBe(false);
  });
});
