import { describe, expect, it } from "bun:test";
import type { AgentIntentRecord } from "@ledgerhq/agent-intent-sdk";
import { formatBaseUnits } from "./evm";
import {
  isTerminalIntentStatus,
  parseIntentId,
  parseStatusFilter,
  toIntentListEntries,
  type AssetLookups,
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
  const SOL_SENDER = "29d2S7vB453rNYFdR5Ycwt7y9haRT5fwVwL9zTmBhfV2";
  const SOL_RECIPIENT = "3JF3sEqM796hk5WFqA6EtmEwJQ9quALszsfJyvXNQKy3";
  const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const USDC_ID = "ethereum/erc20/usd__coin";
  const record = (intent: AgentIntentRecord["intent"]): AgentIntentRecord => ({
    id: "0192f7a4-0000-7000-8000-000000000001",
    agentPubkey: "pubkey",
    status: "signed",
    createdAt: "2026-10-07T10:00:00Z",
    updatedAt: "2026-10-07T10:05:00Z",
    intent,
  });
  const lookups: AssetLookups = {
    ethereumToken: async () => null,
    solanaToken: async mint =>
      mint === USDC_MINT ? { ticker: "USDC", decimals: 6, mint: USDC_MINT } : null,
    swapAsset: async id =>
      ({
        ethereum: { id, ticker: "ETH", decimals: 18 },
        [USDC_ID]: { id, ticker: "USDC", decimals: 6 },
      })[id] ?? null,
  };
  const sendOnlyFields = {
    recipient: null,
    amount: null,
    asset: null,
    feeStrategy: null,
    memo: null,
  };
  const swapIntent = {
    type: "swap",
    network: "ethereum",
    sender: SENDER,
    fromAsset: "ethereum",
    toAsset: USDC_ID,
    fromAmount: "0.5",
    toAmount: "1250",
    provider: "velora",
    description: "Rebalance",
  };
  const solanaSend = {
    type: "send",
    network: "solana",
    sender: SOL_SENDER,
    recipient: SOL_RECIPIENT,
    amount: "500000000",
    asset: { type: "native" },
    memo: "Invoice 42",
  };

  it("shows a swap's pair, amounts and provider, and leaves send-only fields empty", async () => {
    const [entry] = await toIntentListEntries([record(swapIntent)], lookups);

    expect(entry).toMatchObject({
      type: "swap",
      network: "ethereum",
      sender: SENDER,
      displayAmount: "0.5 ETH → 1250 USDC",
      swap: {
        fromAsset: "ethereum",
        toAsset: USDC_ID,
        fromAmount: "0.5",
        toAmount: "1250",
        provider: "velora",
      },
      description: "Rebalance",
      ...sendOnlyFields,
    });
  });

  it("keeps the currency id of a swap asset CAL doesn't know", async () => {
    const [entry] = await toIntentListEntries(
      [record({ ...swapIntent, toAsset: "ethereum/erc20/unknown" })],
      lookups,
    );

    expect(entry?.displayAmount).toBe("0.5 ETH → 1250 ethereum/erc20/unknown");
  });

  it("shows a Solana send in SOL, with its memo", async () => {
    const [entry] = await toIntentListEntries([record(solanaSend)], lookups);

    expect(entry).toMatchObject({
      network: "solana",
      amount: "500000000",
      displayAmount: "0.5 SOL",
      memo: "Invoice 42",
      swap: null,
    });
  });

  it("shows an SPL send in token units when CAL knows the mint, and base units otherwise", async () => {
    const spl = (mint: string) =>
      record({
        ...solanaSend,
        amount: "2500000",
        asset: { type: "spl-token", assetReference: mint },
      });

    const [known, unknown] = await toIntentListEntries(
      [spl(USDC_MINT), spl(SOL_RECIPIENT)],
      lookups,
    );

    expect(known).toMatchObject({ displayAmount: "2.5 USDC", amount: "2500000" });
    expect(unknown).toMatchObject({ displayAmount: null, amount: "2500000" });
  });

  it("shows a Token-2022 send in token units like an SPL one", async () => {
    const [entry] = await toIntentListEntries(
      [
        record({
          ...solanaSend,
          amount: "2500000",
          asset: { type: "spl-token-2022", assetReference: USDC_MINT },
        }),
      ],
      lookups,
    );

    expect(entry?.displayAmount).toBe("2.5 USDC");
  });

  it("looks each asset up once per page, an EVM contract whatever its case", async () => {
    const calls: string[] = [];
    const counting: AssetLookups = {
      ethereumToken: async contract => (calls.push(`eth:${contract}`), null),
      solanaToken: async mint => (calls.push(`sol:${mint}`), null),
      swapAsset: async id => (calls.push(`swap:${id}`), null),
    };
    const erc20 = (contract: string) =>
      record({
        type: "send",
        network: "ethereum",
        sender: SENDER,
        recipient: SENDER,
        amount: "1",
        asset: { type: "erc20", assetReference: contract },
      });
    const spl = record({ ...solanaSend, asset: { type: "spl-token", assetReference: USDC_MINT } });

    await toIntentListEntries(
      [
        erc20(SENDER),
        erc20(SENDER.toLowerCase()),
        spl,
        spl,
        record(swapIntent),
        record(swapIntent),
      ],
      counting,
    );

    expect(calls.sort()).toEqual(
      [`eth:${SENDER}`, `sol:${USDC_MINT}`, "swap:ethereum", `swap:${USDC_ID}`].sort(),
    );
  });

  it("treats a failed lookup as an unknown asset instead of failing the page", async () => {
    const failing: AssetLookups = {
      ethereumToken: () => Promise.reject(new Error("CAL down")),
      solanaToken: () => {
        throw new Error("CAL down");
      },
      swapAsset: () => Promise.reject(new Error("CAL down")),
    };
    const erc20 = record({
      type: "send",
      network: "ethereum",
      sender: SENDER,
      recipient: SENDER,
      amount: "1",
      asset: { type: "erc20", assetReference: SENDER },
    });
    const spl = record({ ...solanaSend, asset: { type: "spl-token", assetReference: USDC_MINT } });

    const entries = await toIntentListEntries([record(swapIntent), erc20, spl], failing);

    expect(entries.map(entry => entry.displayAmount)).toEqual([
      `0.5 ethereum → 1250 ${USDC_ID}`,
      null,
      null,
    ]);
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
      lookups,
    );
    expect(entry).toMatchObject({
      type: "stake",
      network: "ethereum",
      sender: SENDER,
      displayAmount: null,
      swap: null,
      description: null,
      ...sendOnlyFields,
    });
  });
});
