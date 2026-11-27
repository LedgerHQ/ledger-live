import {
  AgentIntentCraftSchema,
  AgentIntentErrorTypeSchema,
  AgentIntentOperationSchema,
  AgentIntentPageSizeSchema,
  AgentIntentRecordSchema,
  AgentIntentSignatureReceiptSchema,
  AgentIntentSignatureSchema,
  AgentIntentStatsSchema,
  AgentIntentSwapOperationSchema,
  AgentProfileInputSchema,
  AgentProfileRecordSchema,
  AgentProfileUpdateSchema,
} from "./schema";
import {
  mockAgentIntentRecord,
  mockAgentProfileRecord,
  mockEvmSendOperation,
  mockSolanaSendOperation,
  mockSwapOperation,
} from "./schema.mock";
import type { AgentIntentOperation, AgentIntentRecordStatus } from "./types";

const EVM_SIGNATURE = `0x${"ab".repeat(64)}1b`;
const SOLANA_SIGNATURE = "cd".repeat(64);

function wireRecord(overrides: Record<string, unknown> = {}) {
  return { ...mockAgentIntentRecord(), ...overrides };
}

function describeOperation(operation: AgentIntentOperation): string {
  switch (operation.type) {
    case "send":
      return `send to ${operation.recipient}`;
    case "swap":
      return `swap with ${operation.provider}`;
    case "unknown":
      return `unknown ${operation.receivedType}`;
  }
}

describe("AgentIntentRecordSchema", () => {
  it("should accept an EVM send, a Solana send and a swap", () => {
    for (const intent of [mockEvmSendOperation(), mockSolanaSendOperation(), mockSwapOperation()]) {
      expect(AgentIntentRecordSchema.safeParse(wireRecord({ intent })).success).toBe(true);
    }
  });

  it("should accept a UUID v7 id and reject an id that isn't a UUID", () => {
    expect(
      AgentIntentRecordSchema.safeParse(wireRecord({ id: "019ac3e2-5b7d-7c41-9a2e-3f6b8d0c1e24" }))
        .success,
    ).toBe(true);
    for (const id of ["..", "intent-1", ""]) {
      expect(AgentIntentRecordSchema.safeParse(wireRecord({ id })).success).toBe(false);
    }
  });

  it("should keep a status added by a newer BFF", () => {
    const record = AgentIntentRecordSchema.parse(wireRecord({ status: "paused" }));

    expect(record.status).toBe("paused");
  });

  it("should read an intent type added by a newer BFF as unknown, keeping the type it received", () => {
    const record = AgentIntentRecordSchema.parse(
      wireRecord({ intent: { type: "stake", validator: "v1" } }),
    );

    expect(record.intent).toEqual({ type: "unknown", receivedType: "stake" });
  });

  it("should give back an unknown intent unchanged when its output is parsed again", () => {
    const record = AgentIntentRecordSchema.parse(wireRecord({ intent: { type: "stake" } }));

    expect(AgentIntentRecordSchema.parse(record).intent).toEqual({
      type: "unknown",
      receivedType: "stake",
    });
  });

  it("should reject a send or a swap that misses a field instead of reading it as an unknown type", () => {
    const { recipient: _recipient, ...sendWithoutRecipient } = mockEvmSendOperation();
    const { provider: _provider, ...swapWithoutProvider } = mockSwapOperation();

    for (const intent of [sendWithoutRecipient, swapWithoutProvider]) {
      expect(AgentIntentRecordSchema.safeParse(wireRecord({ intent })).success).toBe(false);
    }
  });

  it("should reject a send amount that is not an integer in the smallest unit", () => {
    for (const amount of ["0.5", "-1", "1e18", ""]) {
      const intent = { ...mockEvmSendOperation(), amount };
      expect(AgentIntentRecordSchema.safeParse(wireRecord({ intent })).success).toBe(false);
    }
  });

  it("should reject null for an optional field, which the BFF leaves out instead", () => {
    expect(AgentIntentRecordSchema.safeParse(wireRecord({ failureReason: null })).success).toBe(
      false,
    );
    expect(AgentIntentRecordSchema.safeParse(wireRecord({ context: null })).success).toBe(false);
  });

  it("should read the transaction id from the context", () => {
    const record = AgentIntentRecordSchema.parse(
      wireRecord({ context: { transactionId: "0xabc" } }),
    );

    expect(record.context?.transactionId).toBe("0xabc");
  });

  it("should accept dates with microseconds and reject dates without an offset", () => {
    expect(
      AgentIntentRecordSchema.safeParse(wireRecord({ createdAt: "2026-11-26T10:00:00.123456Z" }))
        .success,
    ).toBe(true);
    expect(
      AgentIntentRecordSchema.safeParse(wireRecord({ createdAt: "2026-11-26T10:00:00" })).success,
    ).toBe(false);
  });
});

describe("AgentIntentOperationSchema", () => {
  it("should narrow on the type, the unknown variant included", () => {
    expect(describeOperation(mockEvmSendOperation())).toBe(
      "send to 0x2B5AD5c4795c026514f8317c7a215E218DcCD6cF",
    );
    expect(describeOperation(mockSwapOperation())).toBe("swap with oneinch");
    expect(describeOperation(AgentIntentOperationSchema.parse({ type: "stake" }))).toBe(
      "unknown stake",
    );
  });
});

describe("AgentIntentSwapOperationSchema", () => {
  it("should accept positive decimal amounts and reject zero, leading zeros and signs", () => {
    expect(
      AgentIntentSwapOperationSchema.safeParse(mockSwapOperation({ fromAmount: "0.01" })).success,
    ).toBe(true);
    for (const fromAmount of ["0", "0.00", "01", "-1", "1.", ""]) {
      expect(
        AgentIntentSwapOperationSchema.safeParse({ ...mockSwapOperation(), fromAmount }).success,
      ).toBe(false);
    }
  });
});

describe("AgentIntentRecordStatusSchema", () => {
  it("should not take a plain string as a status", () => {
    const status: string = "paused";
    // @ts-expect-error a status the BFF added has to go through the schema
    const unchecked: AgentIntentRecordStatus = status;

    expect(unchecked).toBe("paused");
  });
});

describe("AgentIntentPageSizeSchema", () => {
  it("should accept only the page sizes the BFF serves", () => {
    expect(AgentIntentPageSizeSchema.safeParse(50).success).toBe(true);
    expect(AgentIntentPageSizeSchema.safeParse(20).success).toBe(false);
  });
});

describe("AgentIntentErrorTypeSchema", () => {
  it("should accept the BFF's error types only", () => {
    expect(AgentIntentErrorTypeSchema.safeParse("stale_revision").success).toBe(true);
    expect(AgentIntentErrorTypeSchema.safeParse("invalid_cursor").success).toBe(false);
  });
});

describe("AgentIntentStatsSchema", () => {
  it("should reject a negative or fractional count", () => {
    expect(AgentIntentStatsSchema.safeParse({ total: -1, approved: 0, rejected: 0 }).success).toBe(
      false,
    );
    expect(AgentIntentStatsSchema.safeParse({ total: 1.5, approved: 0, rejected: 0 }).success).toBe(
      false,
    );
  });
});

describe("AgentIntentCraftSchema", () => {
  it("should accept EVM hex and a Solana base64 transaction", () => {
    expect(
      AgentIntentCraftSchema.safeParse({ rawTransaction: "0x02ef", revision: 1 }).success,
    ).toBe(true);
    expect(
      AgentIntentCraftSchema.safeParse({ rawTransaction: "AQABAg==", revision: 2 }).success,
    ).toBe(true);
  });

  it("should reject odd-length hex, invalid base64 and a revision below 1", () => {
    expect(AgentIntentCraftSchema.safeParse({ rawTransaction: "0x02e", revision: 1 }).success).toBe(
      false,
    );
    expect(AgentIntentCraftSchema.safeParse({ rawTransaction: "AQ=B", revision: 1 }).success).toBe(
      false,
    );
    expect(
      AgentIntentCraftSchema.safeParse({ rawTransaction: "0x02ef", revision: 0 }).success,
    ).toBe(false);
  });
});

describe("AgentIntentSignatureSchema", () => {
  it("should accept an EVM signature with v 1b or 1c and a Solana signature", () => {
    for (const signature of [EVM_SIGNATURE, `0x${"ab".repeat(64)}1c`, SOLANA_SIGNATURE]) {
      expect(AgentIntentSignatureSchema.safeParse(signature).success).toBe(true);
    }
  });

  it("should reject another v, uppercase hex and a Solana signature with 0x", () => {
    for (const signature of [
      `0x${"ab".repeat(64)}1d`,
      EVM_SIGNATURE.toUpperCase(),
      `0x${SOLANA_SIGNATURE}`,
    ]) {
      expect(AgentIntentSignatureSchema.safeParse(signature).success).toBe(false);
    }
  });
});

describe("AgentIntentSignatureReceiptSchema", () => {
  it("should reject a receipt without a transaction id", () => {
    expect(AgentIntentSignatureReceiptSchema.safeParse({ transactionId: "" }).success).toBe(false);
  });
});

describe("AgentProfileRecordSchema", () => {
  it("should read a profile longer than the input limits", () => {
    const profile = { name: "n".repeat(200), description: "", source: "s".repeat(64) };

    expect(
      AgentProfileRecordSchema.safeParse({ ...mockAgentProfileRecord(), profile }).success,
    ).toBe(true);
  });
});

describe("AgentProfileInputSchema", () => {
  const valid = { name: "Research agent", description: "Pays for API calls.", source: "openclaw" };

  it("should accept each field at the BFF limit and reject one character more", () => {
    const atLimit = { name: "n".repeat(80), description: "d".repeat(280), source: "s".repeat(32) };

    expect(AgentProfileInputSchema.safeParse(atLimit).success).toBe(true);
    expect(AgentProfileInputSchema.safeParse({ ...valid, name: "n".repeat(81) }).success).toBe(
      false,
    );
    expect(
      AgentProfileInputSchema.safeParse({ ...valid, description: "d".repeat(281) }).success,
    ).toBe(false);
    expect(AgentProfileInputSchema.safeParse({ ...valid, source: "s".repeat(33) }).success).toBe(
      false,
    );
  });

  it("should reject a field made only of spaces", () => {
    expect(AgentProfileInputSchema.safeParse({ ...valid, name: "   " }).success).toBe(false);
  });
});

describe("AgentProfileUpdateSchema", () => {
  it("should accept one field and reject an empty update", () => {
    expect(AgentProfileUpdateSchema.safeParse({ description: "New text." }).success).toBe(true);
    expect(AgentProfileUpdateSchema.safeParse({}).success).toBe(false);
    expect(AgentProfileUpdateSchema.safeParse({ name: undefined }).success).toBe(false);
  });
});
