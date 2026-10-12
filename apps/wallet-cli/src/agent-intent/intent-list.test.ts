import { describe, expect, it } from "bun:test";
import type { AgentIntentRecord } from "@ledgerhq/agent-intent-sdk";
import { formatBaseUnits } from "./evm";
import {
  isTerminalIntentStatus,
  parseIntentId,
  parseStatusFilter,
  toIntentListEntries,
} from "./intent-list";

describe("isTerminalIntentStatus", () => {
  it.each([
    ["success", true],
    ["failed", true],
    ["rejected", true],
    ["cancelled", true],
    ["expired", true],
    ["created", false],
    ["crafted", false],
    ["signed", false],
    ["broadcast", false],
    ["archived", null],
  ] as const)("%s is %p", (status, expected) => {
    expect(isTerminalIntentStatus(status)).toBe(expected);
  });
});

describe("parseIntentId", () => {
  it("trims and lowercases a UUID", () => {
    expect(parseIntentId(" 0192F7A4-0000-7000-8000-00000000000A ")).toBe(
      "0192f7a4-0000-7000-8000-00000000000a",
    );
  });

  it.each(["intent-123", "", "0192f7a4-0000-7000-8000", "../stats"])("rejects %p", value => {
    expect(() => parseIntentId(value)).toThrow(/is not an intent id/);
  });

  it("echoes a bad value without control characters, truncated", () => {
    expect(() => parseIntentId(`\u001b[2J${"x".repeat(100)}`)).toThrow(
      `--intent "[2J${"x".repeat(61)}…" is not an intent id`,
    );
  });
});

describe("parseStatusFilter", () => {
  it("returns undefined when no filter is given", () => {
    expect(parseStatusFilter(undefined)).toBeUndefined();
  });

  it("trims, de-duplicates and keeps known states", () => {
    expect(parseStatusFilter(" signed,broadcast , signed ")).toEqual(["signed", "broadcast"]);
  });

  it.each(["pending", "signed,PENDING", ",", ""])("rejects %p", value => {
    expect(() => parseStatusFilter(value)).toThrow(/--status/);
  });
});

describe("formatBaseUnits", () => {
  it.each([
    ["10000000000000000", 18, "0.01"],
    ["1000000000000000000000001", 18, "1000000.000000000000000001"],
    ["2500000", 6, "2.5"],
    ["7", 6, "0.000007"],
    ["0", 18, "0"],
  ])("formats %s with %d decimals as %s", (amount, decimals, expected) => {
    expect(formatBaseUnits(amount, decimals)).toBe(expected);
  });
});

describe("toIntentListEntries", () => {
  const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
  const record = (intent: AgentIntentRecord["intent"]): AgentIntentRecord => ({
    id: "0192f7a4-0000-7000-8000-000000000001",
    agentPubkey: "pubkey",
    status: "signed",
    createdAt: "2026-10-07T10:00:00Z",
    updatedAt: "2026-10-07T10:05:00Z",
    intent,
  });
  const noTokenLookup = () => {
    throw new Error("token lookup is only for sends");
  };
  const sendOnlyFields = {
    recipient: null,
    amount: null,
    displayAmount: null,
    asset: null,
    feeStrategy: null,
  };

  it("keeps a swap's common fields and leaves send-only fields empty", async () => {
    const [entry] = await toIntentListEntries(
      [
        record({
          type: "swap",
          network: "ethereum",
          sender: SENDER,
          fromAsset: "ETH",
          toAsset: "USDC",
          fromAmount: "0.01",
          toAmount: "25",
          provider: "paraswap",
          description: "Swap ETH to USDC",
        }),
      ],
      noTokenLookup,
    );
    expect(entry).toMatchObject({
      type: "swap",
      network: "ethereum",
      sender: SENDER,
      description: "Swap ETH to USDC",
      ...sendOnlyFields,
    });
  });

  it("ignores send-like fields on an operation type the SDK doesn't know", async () => {
    const [entry] = await toIntentListEntries(
      [
        record({
          type: "stake",
          network: "ethereum",
          sender: SENDER,
          recipient: SENDER,
          amount: "10000000000000000",
          asset: { type: "native" },
          feeStrategy: "medium",
        }),
      ],
      noTokenLookup,
    );
    expect(entry).toMatchObject({
      type: "stake",
      network: "ethereum",
      sender: SENDER,
      description: null,
      ...sendOnlyFields,
    });
  });
});
