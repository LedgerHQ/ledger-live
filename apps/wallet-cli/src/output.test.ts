import "./live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { getCryptoAssetsStore, setCryptoAssetsStore } from "@ledgerhq/cryptoassets";
import type { CryptoAssetsStore } from "@ledgerhq/types-live";

type MockSpinner = {
  text: string;
  isSpinning: boolean;
  start: () => MockSpinner;
  stop: () => MockSpinner;
  success: (text?: string) => MockSpinner;
  error: (text?: string) => MockSpinner;
  clear: () => MockSpinner;
};

const createdSpinners: MockSpinner[] = [];

mock.module("yocto-spinner", () => ({
  default: ({ text }: { text: string }) => {
    const spin: MockSpinner = {
      text,
      isSpinning: false,
      start() {
        this.isSpinning = true;
        return this;
      },
      stop() {
        this.isSpinning = false;
        return this;
      },
      success(text?: string) {
        if (text) this.text = text;
        this.isSpinning = false;
        return this;
      },
      error(text?: string) {
        if (text) this.text = text;
        this.isSpinning = false;
        return this;
      },
      clear() {
        return this;
      },
    };
    createdSpinners.push(spin);
    return spin;
  },
}));

const { createCommandOutput } = await import("./output");

describe("HumanCommandOutput", () => {
  const envVars = [
    "CLAUDECODE",
    "CLAUDE_CODE",
    "CURSOR_AGENT",
    "CODEX_ENABLED",
    "GEMINI_CLI",
    "OPENCODE",
    "AMP_CURRENT_THREAD_ID",
  ];

  let savedEnv: Record<string, string | undefined> = {};
  let stderrIsTTY: PropertyDescriptor | undefined;

  beforeEach(() => {
    createdSpinners.length = 0;
    savedEnv = {};
    for (const k of [...envVars, "AGENT"]) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    stderrIsTTY = Object.getOwnPropertyDescriptor(process.stderr, "isTTY");
    Object.defineProperty(process.stderr, "isTTY", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    if (stderrIsTTY) {
      Object.defineProperty(process.stderr, "isTTY", stderrIsTTY);
    }
  });

  it("uses the canonical device-state text for signature requests", () => {
    const out = createCommandOutput("human", {
      command: "send",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
    });
    const spin = out.spin("Preparing transaction…") as unknown as MockSpinner;

    out.sendEvent({ type: "device-signature-requested" });

    expect(spin.text).toBe("[⧖] Review on device. Approve or reject.");
    expect(createdSpinners).toHaveLength(1);
  });

  it("emits a plain greppable `hash: <txHash>` line to stdout on broadcasted", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({
      stdout: chunk => {
        writes.push(chunk);
      },
    });
    try {
      const out = createCommandOutput("human", {
        command: "send",
        network: "ethereum:main",
        account: "js:2:ethereum:0x123",
      });
      out.spin("Broadcasting…");
      out.sendEvent({ type: "broadcasted", txHash: "0xdeadbeef" });
    } finally {
      restore();
    }
    expect(writes.join("")).toContain("hash: 0xdeadbeef");
  });

  it("earnPositions() renders Solana stake accounts with the --stake-account hint", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({
      stdout: chunk => {
        writes.push(chunk);
      },
    });
    try {
      const out = createCommandOutput("human", { command: "earn positions", network: "solana" });
      // Empty backend snapshot (no position rows) but the account has on-chain stake accounts:
      // they must still render, passed as the account-level `stakes` argument.
      await out.earnPositions(
        [],
        [
          {
            stakeAccount: "Stake222222222222222222222222222222222222222",
            validator: "CpfvLiiPALdzZTP3fUrALg2TXwEDSAknRh1sn5JCt9Sr",
            state: "inactive",
            stakeBalance: 2_000_000_000,
            withdrawable: 1_997_717_120,
          },
        ],
      );
    } finally {
      restore();
    }
    const joined = writes.join("");
    // The stake account address (the --stake-account value) and its state must be surfaced,
    // and the empty backend snapshot ({}) must NOT be printed as noise.
    expect(joined).toContain("→ --stake-account");
    expect(joined).toContain("Stake222222222222222222222222222222222222222");
    expect(joined).toContain("inactive");
    expect(joined).not.toContain("{}");
    // withdrawable carries the SOL unit too, so it isn't ambiguous next to the staked balance.
    expect(joined).toMatch(/withdrawable\s+[\d.]+\s+SOL/);
  });

  it("earnPositions() renders a backend stake view as human lines (no raw JSON dump)", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({
      stdout: chunk => {
        writes.push(chunk);
      },
    });
    try {
      const out = createCommandOutput("human", { command: "earn positions", network: "ethereum" });
      await out.earnPositions([
        {
          network: "ethereum",
          address: "0x0b6d51060f37487761b471144F2d00393b5908b5",
          isStale: false,
          data: {
            id: { network: "ethereum", address: "0x0b6d" },
            stake: {
              provider: "prv_4a2f9c",
              protocol_name: "Morpho",
              currency: "ethereum",
              interest: { type: "NRR", value: "0.02815256522206406", currency: "ethereum" },
              staked_balance: "1000000000000000000",
              status: "activated",
              commission: "gross",
              rewards: [{ currency: "ethereum", total: "20000000000000000", apy: "0.0331" }],
              "@type": "StakeViewV1Success",
            },
            type: "BatchStakeViewV1",
          },
        },
      ]);
    } finally {
      restore();
    }
    const joined = writes.join("");
    // Field-level rendering, not a raw object dump.
    expect(joined).toContain("Morpho");
    expect(joined).toContain("activated");
    expect(joined).toContain("2.82% NRR"); // interest rate as a percentage
    expect(joined).toContain("3.31%"); // reward apy as a percentage
    expect(joined).toContain("ETH"); // staked balance formatted with the currency code
    expect(joined).not.toContain('"@type"'); // the raw JSON payload must not leak
    expect(joined).not.toContain("staked_balance");
  });

  it("earnYields() omits the rate when interestValue is empty (no misleading 0.00%)", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({ stdout: chunk => writes.push(chunk) });
    try {
      const out = createCommandOutput("human", { command: "earn yields", network: "solana" });
      out.earnYields([
        {
          network: "solana",
          provider: "Ledger by Figment",
          depositToken: "solana",
          interestType: "APY",
          // No Figment APY for this validator: an empty string must not become "0.00%".
          interestValue: "",
          validator: "VoteAcct1111111111111111111111111111111111111",
          commission: 7,
          depositable: true,
        },
      ]);
    } finally {
      restore();
    }
    const joined = writes.join("");
    expect(joined).not.toContain("0.00%");
    expect(joined).toContain("7% fee");
    // The vote account is the value `earn deposit --product` expects.
    expect(joined).toContain("→ --product VoteAcct1111111111111111111111111111111111111");
    // A depositable row is grouped under the CLI deposit-targets section.
    expect(joined).toContain("Deposit targets");
  });

  it("earnYields() splits depositable targets from informational rows and renders the deeplink", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({ stdout: chunk => writes.push(chunk) });
    try {
      const out = createCommandOutput("human", { command: "earn yields", network: "ethereum" });
      out.earnYields([
        {
          // Informational provider row: cannot be deposited from the CLI, surfaces a deeplink.
          network: "ethereum",
          provider: "Lido",
          depositToken: "ethereum",
          interestType: "APY",
          interestValue: "0.0247",
          apy: 2.47,
          category: "liquid",
          liveAppId: "lido",
          deeplink: "ledgerlive://earn?provider=lido",
        },
        {
          // Depositable ETH vault target: same USDC deposit token as the row below.
          network: "ethereum",
          provider: "Kiln",
          depositToken: "USDC",
          interestType: "NRR",
          interestValue: "0.0306",
          vaultId: "vault_morpho_usdc",
          productName: "Morpho USDC",
          depositable: true,
        },
        {
          // A second USDC vault on a different protocol — the product name is what tells them apart.
          network: "ethereum",
          provider: "Kiln",
          depositToken: "USDC",
          interestType: "NRR",
          interestValue: "0.0272",
          vaultId: "vault_aave_usdc",
          productName: "AAVE USDC",
          depositable: true,
        },
      ]);
    } finally {
      restore();
    }
    const joined = writes.join("");
    expect(joined).toContain("open in Ledger Live");
    expect(joined).toContain("Deposit targets");
    expect(joined).toContain("2.47% APY");
    // hyperlink() falls back to the plain URL when stdout is not a TTY.
    expect(joined).toContain("ledgerlive://earn?provider=lido");
    expect(joined).toContain("→ --product vault_morpho_usdc");
    // Two vaults share the USDC deposit token, so the product name must disambiguate them.
    expect(joined).toContain("Morpho USDC");
    expect(joined).toContain("AAVE USDC");
  });

  it("earnPositions() renders the `stakes` array branch as human lines", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({ stdout: chunk => writes.push(chunk) });
    try {
      const out = createCommandOutput("human", { command: "earn positions", network: "solana" });
      await out.earnPositions([
        {
          network: "solana",
          address: "2XUhv9PZohcQrwsx3AnYMrHCbssWZuAFdwixd67ZYhYN",
          data: {
            // `stakes` (plural array) rather than `stake` (singular) — exercises the array branch
            // of extractStakeViews.
            stakes: [
              {
                protocol_name: "Marinade",
                status: "active",
                currency: "solana",
                staked_balance: "1000000000",
                interest: { type: "APY", value: "0.07" },
              },
            ],
          },
        },
      ]);
    } finally {
      restore();
    }
    const joined = writes.join("");
    expect(joined).toContain("Marinade");
    expect(joined).toContain("active");
    expect(joined).toContain("7.00% APY");
    expect(joined).toContain("SOL"); // staked balance formatted with the currency code
    expect(joined).not.toContain("staked_balance"); // not a raw JSON dump
  });

  it("earnPositions() falls back to raw JSON when no recognizable stake object is present", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({ stdout: chunk => writes.push(chunk) });
    try {
      const out = createCommandOutput("human", { command: "earn positions", network: "ethereum" });
      await out.earnPositions([
        {
          network: "ethereum",
          address: "0x0b6d51060f37487761b471144F2d00393b5908b5",
          // Neither `stake` nor `stakes`: extractStakeViews returns [], so the payload is dumped
          // verbatim rather than hidden.
          data: { unrecognized: "shape", nested: { foo: "bar" } },
        },
      ]);
    } finally {
      restore();
    }
    const joined = writes.join("");
    expect(joined).toContain("unrecognized");
    expect(joined).toContain("bar");
  });

  it("earnPositions() falls back to the raw amount when the currency is unknown", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({ stdout: chunk => writes.push(chunk) });
    // formatAmount throws for an unknown currency; stub the store so the lookup resolves to
    // undefined synchronously (no network) and the _safeAmount catch branch is exercised.
    const realStore = getCryptoAssetsStore();
    setCryptoAssetsStore({
      findTokenById: async () => undefined,
      findTokenByAddressInCurrency: async () => undefined,
      getTokensSyncHash: async () => "",
    } as unknown as CryptoAssetsStore);
    try {
      const out = createCommandOutput("human", { command: "earn positions", network: "ethereum" });
      await out.earnPositions([
        {
          network: "ethereum",
          address: "0x0b6d51060f37487761b471144F2d00393b5908b5",
          data: {
            stake: {
              protocol_name: "Mystery",
              staked_balance: "12345",
              currency: "definitely-not-a-currency",
            },
          },
        },
      ]);
    } finally {
      restore();
      setCryptoAssetsStore(realStore);
    }
    const joined = writes.join("");
    expect(joined).toContain("12345");
    expect(joined).toContain("(definitely-not-a-currency)");
  });

  it("earnDepositResult() always renders result.status (dry-run wording)", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({ stdout: chunk => writes.push(chunk) });
    try {
      const out = createCommandOutput("human", { command: "earn deposit", network: "solana:main" });
      out.earnDepositResult({
        family: "solana",
        account: "acc",
        network: "solana:main",
        amount: "1 SOL",
        product: "VoteAcct1",
        validator: "VoteAcct1",
        dryRun: true,
        status: "dry-run",
        transactions: [{ kind: "stake.delegate", amount: "1 SOL" }],
      });
    } finally {
      restore();
    }
    expect(writes.join("")).toContain("dry-run");
  });

  it("earnDepositResult() surfaces the EVM approve-needed status note", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({ stdout: chunk => writes.push(chunk) });
    try {
      const out = createCommandOutput("human", {
        command: "earn deposit",
        network: "ethereum:main",
      });
      out.earnDepositResult({
        family: "evm",
        account: "0xabc",
        network: "ethereum:main",
        amount: "0.5 ETH",
        product: "vault_kiln_eth",
        dryRun: true,
        // The deposit could not be simulated because an approve must be broadcast first.
        status: "approve validated; deposit needs an on-chain allowance",
        transactions: [{ kind: "approve", status: "validated" }],
      });
    } finally {
      restore();
    }
    expect(writes.join("")).toContain("approve validated; deposit needs an on-chain allowance");
  });

  it("token() writes the formatted token info to stdout", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const { USDT_TOKEN_INFO } = await import("./test/helpers/cal-fixtures");
    const writes: string[] = [];
    const restore = installOutputCapture({
      stdout: chunk => {
        writes.push(chunk);
      },
    });
    try {
      const out = createCommandOutput("human", {
        command: "assets token",
        network: "ethereum",
      });
      out.token(USDT_TOKEN_INFO);
    } finally {
      restore();
    }
    const joined = writes.join("");
    expect(joined).toContain(USDT_TOKEN_INFO.id);
    expect(joined).toContain(USDT_TOKEN_INFO.ticker);
    expect(joined).toContain(USDT_TOKEN_INFO.contractAddress);
  });
});
