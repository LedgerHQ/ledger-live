import "../../live-common-setup";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import {
  AgentIntentHttpError,
  AgentIntentSdkError,
  type SendIntent,
} from "@ledgerhq/agent-intent-sdk";
import { installOutputCapture } from "../../shared/ui";
import { toChecksumAddress } from "../../agent-intent/evm";
import { AgentIntentCorruptKeychainError } from "../../key-ring/agent-intent-keychain";
import type { TokenCandidate } from "../../agent-intent/token-lookup";
import {
  activateAgentIntentMocks,
  deactivateAgentIntentMocks,
  realAgentIntentSdk,
} from "./__test-helpers__/agent-intent-mocks";

const agent = realAgentIntentSdk.createSoftwareAgentIdentity();
const SECRET_KEY = agent.exportSecretKey();
const OTHER_AGENT = realAgentIntentSdk.createSoftwareAgentIdentity();

// EIP-55 specification vectors, so checksums are known-good.
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
const USDC = toChecksumAddress("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
// Two ERC-20s CAL lists under the PEPE ticker.
const PEPE = toChecksumAddress("0x6982508145454ce325ddbe47a25d4ec3d2311933");
const PEPE_COPY = toChecksumAddress("0xbe042e9d09cb588331ff911c2b46fd833a3e5bd6");

// The 0x11 × 32 and 0x22 × 32 keys of agent-intent-service ADR-0002's Solana vectors.
const SOL_SENDER = "29d2S7vB453rNYFdR5Ycwt7y9haRT5fwVwL9zTmBhfV2";
const SOL_RECIPIENT = "3JF3sEqM796hk5WFqA6EtmEwJQ9quALszsfJyvXNQKy3";
// USDC is a classic SPL Token mint, PYUSD a Token-2022 one.
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const PYUSD_MINT = "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo";
const TOKEN_2022_USDC_MINT = "Usdc2o22Mint11111111111111111111111111111111";

const DEEPLINK = "https://app.agents.ledger-test.com/intents/intent-123";

const enrolledProfile = {
  profileId: "bot",
  displayName: "Bot",
  description: "Remote agent that proposes intents for review.",
  source: "openclaw",
  environment: "staging",
  bffBaseUrl: "https://global.api.stg.ledger-test.com/agent-intent",
  publicKey: agent.publicKey,
  trustchainId: "tc-1",
  enrollmentExpiresAt: new Date(Date.now() + 60_000).toISOString(),
  createdAt: new Date().toISOString(),
};

const accounts = [
  { label: "ethereum-1", descriptor: `account:2:address:ethereum:${SENDER}:m/44h/60h/0h/0/0` },
  { label: "solana-1", descriptor: `account:2:address:solana:${SOL_SENDER}:m/44h/501h/0h/0h` },
  {
    label: "solana_devnet-1",
    descriptor: `account:2:address:solana_devnet:${SOL_SENDER}:m/44h/501h/0h/0h`,
  },
  {
    label: "solana-corrupt",
    descriptor: `account:2:address:solana:${SOL_SENDER}11:m/44h/501h/1h/0h`,
  },
  {
    label: "bitcoin-native-1",
    descriptor:
      "account:2:utxo:bitcoin:xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz:m/84h/0h/0h",
  },
];

let profiles: Record<string, unknown>;
let secretKeyImpl: () => Promise<string | null>;
let secretKeyReads: number;
let createSendIntentImpl: (intent: SendIntent) => Promise<string>;
let submittedIntents: SendIntent[];
let clientOptions: Array<Record<string, unknown>>;
let makeClient: ((options: Record<string, unknown>) => unknown) | undefined;
let stdout: string[];
let stderr: string[];
let mintPrograms: Record<string, string | undefined>;
let calTokens: Record<string, TokenCandidate[]>;
let tickerLookups: string[];
let accountTokens: Record<string, TokenCandidate[]>;
let accountTokensError: Error | undefined;
let accountLookups: number;

const usdc = { ticker: "USDC", name: "USD Coin", address: USDC.toLowerCase() };
const usdcMint = { ticker: "USDC", name: "USD Coin", address: USDC_MINT };
const pyusdMint = { ticker: "PYUSD", name: "PayPal USD", address: PYUSD_MINT };
const token2022UsdcMint = {
  ticker: "USDC",
  name: "USD Coin (Token-2022)",
  address: TOKEN_2022_USDC_MINT,
};
const pepe = { ticker: "PEPE", name: "Pepe", address: PEPE.toLowerCase() };
const pepeCopy = { ticker: "PEPE", name: "Pepe_0xbe042e", address: PEPE_COPY.toLowerCase() };

beforeAll(() =>
  activateAgentIntentMocks({
    sessionRead: async () => ({
      get accounts() {
        accountLookups++;
        return accounts;
      },
      getAgentIntentProfile: (id: string) => profiles[id],
    }),
    keychain: {
      loadAgentIntentSecretKey: async () => {
        secretKeyReads++;
        return secretKeyImpl();
      },
    },
    sdk: {
      createAgentIntentClient: (options: Record<string, unknown>) => {
        clientOptions.push(options);
        if (makeClient) return makeClient(options);
        return {
          publicKey: agent.publicKey,
          createSendIntent: async (intent: SendIntent) => {
            submittedIntents.push(intent);
            return createSendIntentImpl(intent);
          },
        };
      },
    },
    tokenLookup: {
      findEthereumToken: async (contract: string) =>
        [usdc, pepe, pepeCopy]
          .filter(token => token.address.toLowerCase() === contract.toLowerCase())
          .map(token => ({ ticker: token.ticker, decimals: 6, contract: token.address }))[0] ??
        null,
      findSolanaToken: async (mint: string) =>
        ({
          [USDC_MINT]: { ticker: "USDC", decimals: 6, mint: USDC_MINT },
          [PYUSD_MINT]: { ticker: "PYUSD", decimals: 6, mint: PYUSD_MINT },
          [TOKEN_2022_USDC_MINT]: { ticker: "USDC", decimals: 6, mint: TOKEN_2022_USDC_MINT },
        })[mint] ?? null,
      findSolanaMintProgram: async (mint: string) => mintPrograms[mint],
      // Like CAL: the ticker as typed or uppercase, matched case-sensitively.
      findTokensByTicker: async (network: string, ticker: string) => {
        tickerLookups.push(`${network} ${ticker}`);
        return (calTokens[network] ?? []).filter(
          token => token.ticker === ticker || token.ticker === ticker.toUpperCase(),
        );
      },
      findAccountTokens: async (account: { address: string }) => {
        if (accountTokensError) throw accountTokensError;
        return accountTokens[account.address] ?? [];
      },
    },
  }),
);
afterAll(() => deactivateAgentIntentMocks());

const { default: sendCommand } = await import("./send");

type SendFlags = {
  profile: string;
  account?: string;
  from?: string;
  to: string;
  amount: string;
  token?: string;
  "fee-strategy"?: "slow" | "medium" | "fast";
  memo?: string;
  description?: string;
  "dry-run": boolean;
  output?: "human" | "json";
};

function runSend(overrides: Partial<SendFlags> = {}) {
  const flags: SendFlags = {
    profile: "bot",
    from: SENDER,
    to: RECIPIENT,
    amount: "0.01 ETH",
    "fee-strategy": "medium",
    "dry-run": false,
    ...overrides,
  };
  return (
    sendCommand as unknown as { handler: (a: { flags: SendFlags }) => Promise<void> }
  ).handler({ flags });
}

function jsonResult(): Record<string, unknown> {
  return JSON.parse(stdout.join("").trim().split("\n").at(-1) ?? "{}");
}

describe("agent-intent send", () => {
  let restore: () => void;

  beforeEach(() => {
    profiles = { bot: enrolledProfile };
    secretKeyImpl = async () => SECRET_KEY;
    secretKeyReads = 0;
    createSendIntentImpl = async () => DEEPLINK;
    submittedIntents = [];
    clientOptions = [];
    makeClient = undefined;
    stdout = [];
    stderr = [];
    mintPrograms = {
      [USDC_MINT]: "spl-token",
      [PYUSD_MINT]: "spl-token-2022",
      [TOKEN_2022_USDC_MINT]: "spl-token-2022",
    };
    calTokens = { ethereum: [usdc, pepe, pepeCopy], solana: [usdcMint, pyusdMint] };
    tickerLookups = [];
    accountTokens = {};
    accountTokensError = undefined;
    accountLookups = 0;
    restore = installOutputCapture({
      stdout: chunk => stdout.push(chunk),
      stderr: chunk => stderr.push(chunk),
    });
  });

  afterEach(() => restore());

  describe("native ETH", () => {
    it("proposes an exact base-unit amount and reports the intent id and review link", async () => {
      await runSend({ output: "json" });

      expect(submittedIntents).toEqual([
        {
          type: "send",
          network: "ethereum",
          sender: SENDER,
          recipient: RECIPIENT,
          amount: "10000000000000000",
          asset: { type: "native" },
          feeStrategy: "medium",
        },
      ]);
      expect(jsonResult()).toMatchObject({
        status: "success",
        command: "agent-intent send",
        // The envelope's network, unchanged by Solana support.
        network: "ethereum",
        intentId: "intent-123",
        deeplink: DEEPLINK,
        profileId: "bot",
        sender: SENDER,
        recipient: RECIPIENT,
        asset: { type: "native", ticker: "ETH", decimals: 18 },
        amount: "10000000000000000",
        feeStrategy: "medium",
        submitted: true,
      });
    });

    it("authenticates with the profile's own identity, trustchain, BFF and environment", async () => {
      await runSend();

      expect(clientOptions).toEqual([
        expect.objectContaining({
          bffBaseUrl: enrolledProfile.bffBaseUrl,
          trustchainId: "tc-1",
          environment: "staging",
          identity: expect.objectContaining({ publicKey: agent.publicKey }),
        }),
      ]);
    });

    it("prints the network and fee level in human output", async () => {
      await runSend({ "dry-run": true });

      const text = stdout.join("");
      expect(text).toContain("Network: Ethereum mainnet");
      expect(text).toContain("Fee:     medium");
      expect(text).not.toContain("Memo:");
    });

    it("passes the fee strategy and description through", async () => {
      await runSend({ "fee-strategy": "fast", description: "Monthly rent" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ feeStrategy: "fast", description: "Monthly rent" }),
      ]);
    });

    it("shows the review link and says no transaction was signed or broadcast", async () => {
      await runSend();

      const printed = stdout.join("");
      expect(printed).toContain(DEEPLINK);
      expect(printed).toContain("no transaction was signed or broadcast");
      expect(printed).toContain("Amount:  0.01 ETH");
    });
  });

  describe("native SOL", () => {
    const sol = (overrides: Partial<SendFlags> = {}) =>
      runSend({
        from: SOL_SENDER,
        to: SOL_RECIPIENT,
        amount: "0.5 SOL",
        "fee-strategy": undefined,
        output: "json",
        ...overrides,
      });

    it("proposes a Solana send in lamports, with its memo and no fee strategy", async () => {
      await sol({ memo: "Invoice 42", description: "Pay supplier" });

      expect(submittedIntents).toEqual([
        {
          type: "send",
          network: "solana",
          sender: SOL_SENDER,
          recipient: SOL_RECIPIENT,
          amount: "500000000",
          asset: { type: "native" },
          memo: "Invoice 42",
          description: "Pay supplier",
        },
      ]);
      const result = jsonResult();
      expect(result).toMatchObject({
        status: "success",
        network: "solana",
        asset: { type: "native", ticker: "SOL", decimals: 9 },
        amount: "500000000",
        memo: "Invoice 42",
        submitted: true,
      });
      expect(result).not.toHaveProperty("feeStrategy");
    });

    it("resolves the sender from a Solana mainnet session label", async () => {
      await sol({ from: undefined, account: "solana-1" });

      expect(submittedIntents).toEqual([expect.objectContaining({ sender: SOL_SENDER })]);
    });

    it("refuses an Ethereum account for a SOL amount, pointing to --token", async () => {
      await expect(
        sol({ from: undefined, account: "ethereum-1", output: undefined }),
      ).rejects.toThrow(
        'Account "ethereum-1" is on ethereum, but SOL is a native Solana send. To send a token ' +
          "with that ticker from this account, pass its address with --token.",
      );
      expect(submittedIntents).toEqual([]);
    });

    it.each([
      [{ "fee-strategy": "fast" as const }, "--fee-strategy is Ethereum only"],
      [{ to: `${SOL_RECIPIENT.slice(0, -1)}0` }, "Invalid intent: --to must be base58."],
      [{ to: RECIPIENT }, "Invalid intent: --to must be base58."],
      [{ from: `${SOL_SENDER}11` }, "Invalid intent: --from must be a 32-byte base58 address."],
      [{ amount: "0 SOL" }, "Amount must be greater than zero."],
      [{ amount: "0.0000000001 SOL" }, "SOL supports at most 9"],
    ])("refuses %j", async (overrides, message) => {
      await expect(sol({ ...overrides, output: undefined })).rejects.toThrow(message);
      expect(submittedIntents).toEqual([]);
    });

    it("refuses a memo on an Ethereum send", async () => {
      await expect(runSend({ memo: "Invoice 42" })).rejects.toThrow("--memo is Solana only.");
      expect(submittedIntents).toEqual([]);
    });

    it("keeps an ERC-20 whose ticker is SOL on Ethereum", async () => {
      // With --token the SOL ticker names an ERC-20, so the Ethereum path checks it against CAL.
      await expect(runSend({ amount: "5 SOL", token: USDC })).rejects.toThrow(
        `--amount is in SOL, but --token ${USDC} is USDC.`,
      );
      expect(submittedIntents).toEqual([]);
    });

    it("prints the network and memo, and no fee level, in human output", async () => {
      await sol({ memo: "Invoice 42", output: undefined, "dry-run": true });

      const text = stdout.join("");
      expect(text).toContain("Network: Solana mainnet");
      expect(text).toContain("Amount:  0.5 SOL");
      expect(text).toContain("Memo:    Invoice 42");
      expect(text).not.toContain("Fee:");
    });

    it("names the account label when the SDK refuses its address", async () => {
      await expect(
        sol({ from: undefined, account: "solana-corrupt", output: undefined }),
      ).rejects.toThrow(
        'Invalid intent: account "solana-corrupt" must be a 32-byte base58 address.',
      );
      expect(submittedIntents).toEqual([]);
    });
  });

  describe("SPL token", () => {
    const spl = (overrides: Partial<SendFlags> = {}) =>
      runSend({
        from: SOL_SENDER,
        to: SOL_RECIPIENT,
        amount: "25.5 USDC",
        token: USDC_MINT,
        "fee-strategy": undefined,
        output: "json",
        ...overrides,
      });

    it("proposes a Solana send of the mint in the token's base units", async () => {
      await spl({ memo: "Invoice 42" });

      expect(submittedIntents).toEqual([
        {
          type: "send",
          network: "solana",
          sender: SOL_SENDER,
          recipient: SOL_RECIPIENT,
          amount: "25500000",
          asset: { type: "spl-token", assetReference: USDC_MINT },
          memo: "Invoice 42",
        },
      ]);
      expect(jsonResult()).toMatchObject({
        network: "solana",
        asset: { type: "spl-token", ticker: "USDC", decimals: 6, mint: USDC_MINT },
        amount: "25500000",
        displayAmount: "25.5",
      });
    });

    it("picks Solana from a base58 --token, so an Ethereum account is refused", async () => {
      await expect(
        spl({ from: undefined, account: "ethereum-1", output: undefined }),
      ).rejects.toThrow(/on ethereum; this Agent Intent send needs a Solana mainnet account/);
    });

    it("names the token and its mint in human output", async () => {
      await spl({ output: undefined, "dry-run": true });

      expect(stdout.join("")).toContain(`Amount:  25.5 USDC (${USDC_MINT})`);
    });

    it.each([
      [
        { amount: "1 PYUSD", token: PYUSD_MINT },
        `--token ${PYUSD_MINT} (PYUSD) is a Token-2022 mint, which Agent Intent can't send yet.`,
      ],
      [
        { amount: "1 XYZ", token: SOL_RECIPIENT },
        `--token ${SOL_RECIPIENT} is not a known SPL token on Solana mainnet.`,
      ],
      [{ amount: "25 USDT" }, `--amount is in USDT, but --token ${USDC_MINT} is USDC.`],
      [{ amount: "1.0000001 USDC" }, "7 decimal places, but USDC supports at most 6"],
      [{ "fee-strategy": "fast" as const }, "--fee-strategy is Ethereum only"],
    ])("refuses %j", async (overrides, message) => {
      await expect(spl({ ...overrides, output: undefined })).rejects.toThrow(message);
      expect(submittedIntents).toEqual([]);
    });

    it("refuses a mint the node can't confirm as a classic SPL Token mint", async () => {
      mintPrograms = {};

      await expect(spl({ output: undefined })).rejects.toThrow(
        `--token ${USDC_MINT} (USDC) isn't a mint of the SPL Token program on Solana mainnet.`,
      );
      expect(submittedIntents).toEqual([]);
    });
  });

  describe("sender", () => {
    it("resolves an account label to its address", async () => {
      await runSend({ from: undefined, account: "ethereum-1" });

      expect(submittedIntents).toEqual([expect.objectContaining({ sender: SENDER })]);
    });

    it("rejects a label on a network Agent Intent doesn't support", async () => {
      await expect(runSend({ from: undefined, account: "bitcoin-native-1" })).rejects.toThrow(
        /on bitcoin; this Agent Intent send needs an Ethereum mainnet account/,
      );
    });

    it("asks a Solana devnet account for a Solana mainnet one, not an Ethereum one", async () => {
      await expect(
        runSend({
          from: undefined,
          account: "solana_devnet-1",
          to: SOL_RECIPIENT,
          amount: "25 USDC",
          "fee-strategy": undefined,
        }),
      ).rejects.toThrow(/on solana_devnet; this Agent Intent send needs a Solana mainnet account/);
      expect(tickerLookups).toEqual([]);
    });

    it("rejects an unknown label", async () => {
      await expect(runSend({ from: undefined, account: "ethereum-9" })).rejects.toThrow(
        /No account labeled "ethereum-9"/,
      );
    });

    it("requires exactly one of --account and --from", async () => {
      const message = "Pass exactly one sender: --account <session-label> or --from <address>.";
      await expect(runSend({ from: undefined })).rejects.toThrow(message);
      await expect(runSend({ account: "ethereum-1" })).rejects.toThrow(message);
    });

    it("validates explicit sender and recipient addresses", async () => {
      await expect(runSend({ from: "0x1234" })).rejects.toThrow(/--from .*not an EVM address/);
      await expect(runSend({ to: RECIPIENT.replace("fB69", "Fb69") })).rejects.toThrow(
        /--to .*invalid EIP-55 checksum/,
      );
      expect(submittedIntents).toEqual([]);
    });
  });

  describe("ERC-20", () => {
    it("proposes a token send with the contract as asset reference and token decimals", async () => {
      await runSend({ amount: "25.5 USDC", token: USDC.toLowerCase(), output: "json" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({
          amount: "25500000",
          asset: { type: "erc20", assetReference: USDC },
        }),
      ]);
      expect(jsonResult()).toMatchObject({
        asset: { type: "erc20", ticker: "USDC", decimals: 6, contract: USDC },
        amount: "25500000",
        displayAmount: "25.5",
      });
    });

    it("names the token and its contract in human output", async () => {
      await runSend({ amount: "25 USDC", token: USDC });

      expect(stdout.join("")).toContain(`Amount:  25 USDC (${USDC})`);
    });

    it("rejects a contract CAL doesn't know on Ethereum mainnet", async () => {
      await expect(
        runSend({ amount: "1 XYZ", token: "0x0000000000000000000000000000000000000001" }),
      ).rejects.toThrow(/not a known ERC-20 token on Ethereum mainnet/);
    });

    it("rejects a ticker that doesn't match the token, naming the checksummed contract", async () => {
      await expect(runSend({ amount: "25 USDT", token: USDC.toLowerCase() })).rejects.toThrow(
        `--amount is in USDT, but --token ${USDC} is USDC. Fix whichever one is wrong.`,
      );
    });
  });

  describe("token from the --amount ticker, without --token", () => {
    const stderrLines = () => stderr.join("").split("\n");

    it("takes the token the --account holds before any ticker lookup, checksummed", async () => {
      accountTokens = { [SENDER]: [pepe] };

      await runSend({ from: undefined, account: "ethereum-1", amount: "1 pepe", output: "json" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ asset: { type: "erc20", assetReference: PEPE } }),
      ]);
      expect(tickerLookups).toEqual([]);
      expect(stderrLines()).toContain(`PEPE is ${PEPE} (Pepe), held by "ethereum-1".`);
    });

    it("looks the --account up in the session once for its network, sender and tokens", async () => {
      accountTokens = { [SENDER]: [pepe] };

      await runSend({ from: undefined, account: "ethereum-1", amount: "1 PEPE" });

      expect(submittedIntents).toHaveLength(1);
      expect(accountLookups).toBe(1);
    });

    it("takes the SPL token a Solana --account holds", async () => {
      accountTokens = { [SOL_SENDER]: [usdcMint] };

      await runSend({
        from: undefined,
        account: "solana-1",
        to: SOL_RECIPIENT,
        amount: "25 USDC",
        "fee-strategy": undefined,
        output: "json",
      });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ asset: { type: "spl-token", assetReference: USDC_MINT } }),
      ]);
      expect(tickerLookups).toEqual([]);
    });

    it("skips a Token-2022 mint when the Solana --account also holds a classic one", async () => {
      accountTokens = { [SOL_SENDER]: [token2022UsdcMint, usdcMint] };

      await runSend({
        from: undefined,
        account: "solana-1",
        to: SOL_RECIPIENT,
        amount: "25 USDC",
        "fee-strategy": undefined,
        output: "json",
      });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ asset: { type: "spl-token", assetReference: USDC_MINT } }),
      ]);
    });

    it("refuses the only Token-2022 mint a Solana --account holds rather than CAL's", async () => {
      accountTokens = { [SOL_SENDER]: [token2022UsdcMint] };

      await expect(
        runSend({
          from: undefined,
          account: "solana-1",
          to: SOL_RECIPIENT,
          amount: "25 USDC",
          "fee-strategy": undefined,
        }),
      ).rejects.toThrow(
        `${TOKEN_2022_USDC_MINT} (USDC) is a Token-2022 mint, which Agent Intent can't send yet.`,
      );
      expect(tickerLookups).toEqual([]);
      expect(submittedIntents).toEqual([]);
    });

    it("falls back to CAL, saying why on stderr, when it can't read the --account's tokens", async () => {
      accountTokensError = new Error("RPC unreachable");

      await runSend({ from: undefined, account: "ethereum-1", amount: "25 USDC" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ asset: { type: "erc20", assetReference: USDC } }),
      ]);
      expect(tickerLookups).toEqual(["ethereum USDC"]);
      expect(stderrLines()).toContain(
        'Couldn\'t read the tokens account "ethereum-1" holds (RPC unreachable), so USDC is ' +
          "looked up in the Crypto Assets List instead.",
      );
    });

    it("refuses when the --account holds several tokens with the ticker", async () => {
      accountTokens = { [SENDER]: [pepe, pepeCopy] };

      await expect(
        runSend({ from: undefined, account: "ethereum-1", amount: "1 PEPE" }),
      ).rejects.toThrow(
        `Account "ethereum-1" holds several ERC-20 tokens with the ticker PEPE:\n` +
          `  ${PEPE} (Pepe)\n  ${PEPE_COPY} (Pepe_0xbe042e)\nPass the one to send with --token.`,
      );
      expect(submittedIntents).toEqual([]);
    });

    it("falls back to CAL when the --account holds no token with the ticker", async () => {
      accountTokens = { [SENDER]: [pepe] };

      await runSend({ from: undefined, account: "ethereum-1", amount: "25 USDC" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ asset: { type: "erc20", assetReference: USDC } }),
      ]);
      expect(tickerLookups).toEqual(["ethereum USDC"]);
    });

    it("takes the only ERC-20 CAL lists under the ticker for a 0x --from", async () => {
      await runSend({ amount: "25.5 usdc", output: "json" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({
          amount: "25500000",
          asset: { type: "erc20", assetReference: USDC },
        }),
      ]);
      expect(jsonResult()).toMatchObject({
        network: "ethereum",
        asset: { type: "erc20", ticker: "USDC", contract: USDC },
      });
      expect(stderrLines()).toContain(
        `USDC is ${USDC} (USD Coin), the only ERC-20 token with that ticker on Ethereum mainnet.`,
      );
    });

    it.each([
      ["a base58 --from", { from: SOL_SENDER }],
      ["a Solana --account", { from: undefined, account: "solana-1" }],
    ])("sends the SPL token on Solana for %s", async (_, sender) => {
      await runSend({
        ...sender,
        to: SOL_RECIPIENT,
        amount: "25 USDC",
        "fee-strategy": undefined,
        output: "json",
      });

      expect(submittedIntents).toEqual([
        expect.objectContaining({
          network: "solana",
          asset: { type: "spl-token", assetReference: USDC_MINT },
        }),
      ]);
      expect(jsonResult()).toMatchObject({ network: "solana" });
    });

    it("lists the candidates, checksummed, when CAL has several tokens with the ticker", async () => {
      await expect(runSend({ amount: "1 PEPE" })).rejects.toThrow(
        "Several ERC-20 tokens on Ethereum mainnet have the ticker PEPE:\n" +
          `  ${PEPE} (Pepe)\n  ${PEPE_COPY} (Pepe_0xbe042e)\nPass the one to send with --token.`,
      );
      expect(submittedIntents).toEqual([]);
    });

    it("refuses a ticker CAL doesn't list on the sender's network", async () => {
      await expect(runSend({ amount: "1 XYZ" })).rejects.toThrow(
        "No ERC-20 token on Ethereum mainnet has the ticker XYZ in the Crypto Assets List, which " +
          "matches tickers case-sensitively (e.g. USDe, stETH). Check the ticker, or pass the " +
          "token's address with --token.",
      );
    });

    it("refuses a --from that is neither an EVM nor a Solana address", async () => {
      await expect(
        runSend({ from: SENDER.slice(2, 30), amount: "25 USDC", "fee-strategy": "fast" }),
      ).rejects.toThrow(
        `--from ${SENDER.slice(2, 30)} is neither an EVM address (0x…) nor a Solana one (base58), ` +
          "so it names no network for the token.",
      );
      expect(tickerLookups).toEqual([]);
    });

    it("refuses a --token that is neither an EVM nor a Solana address", async () => {
      await expect(runSend({ amount: "25 USDC", token: "usdc" })).rejects.toThrow(
        "--token usdc is neither an EVM address (0x…) nor a Solana one (base58), so it names no " +
          "network for the token.",
      );
      expect(submittedIntents).toEqual([]);
    });

    it("keeps ETH on Ethereum, so a base58 --from is refused", async () => {
      await expect(runSend({ from: SOL_SENDER, amount: "1 ETH" })).rejects.toThrow(
        /--from .*not an EVM address/,
      );
    });

    it("keeps ETH native for a Solana --account, pointing to --token for an SPL ETH", async () => {
      await expect(
        runSend({ from: undefined, account: "solana-1", amount: "1 ETH" }),
      ).rejects.toThrow(
        'Account "solana-1" is on solana, but ETH is a native Ethereum send. To send a token with ' +
          "that ticker from this account, pass its address with --token.",
      );
      expect(tickerLookups).toEqual([]);
    });

    it("still refuses a Token-2022 mint it resolved", async () => {
      await expect(
        runSend({
          from: SOL_SENDER,
          to: SOL_RECIPIENT,
          amount: "1 PYUSD",
          "fee-strategy": undefined,
        }),
      ).rejects.toThrow(
        `${PYUSD_MINT} (PYUSD) is a Token-2022 mint, which Agent Intent can't send yet.`,
      );
      expect(submittedIntents).toEqual([]);
    });

    it("never looks the ticker up when --token is given", async () => {
      await runSend({ amount: "25 USDC", token: USDC });

      expect(tickerLookups).toEqual([]);
    });
  });

  describe("amount", () => {
    it("rejects more decimals than the asset has instead of rounding", async () => {
      await expect(runSend({ amount: "1.0000001 USDC", token: USDC })).rejects.toThrow(
        /7 decimal places, but USDC supports at most 6/,
      );
      expect(submittedIntents).toEqual([]);
    });

    it("keeps a value beyond 2^53 exact", async () => {
      await runSend({ amount: "123456789.123456789123456789 ETH" });

      expect(submittedIntents).toEqual([
        expect.objectContaining({ amount: "123456789123456789123456789" }),
      ]);
    });
  });

  describe("profile and keychain", () => {
    it("rejects an unknown profile", async () => {
      await expect(runSend({ profile: "nope" })).rejects.toThrow(
        /No Agent Intent profile named "nope"/,
      );
    });

    it("rejects a profile whose enrollment wasn't completed", async () => {
      profiles = { bot: { ...enrolledProfile, trustchainId: undefined } };

      await expect(runSend()).rejects.toThrow(/not enrolled yet.*agent-intent enroll/s);
      expect(secretKeyReads).toBe(0);
    });

    it("uses the BFF and Keycloak URLs recorded on the profile at enroll time", async () => {
      profiles = {
        bot: {
          ...enrolledProfile,
          bffBaseUrl: "https://bff.example.com/agent-intent",
          keycloakBaseUrl: "https://keycloak.example.com/",
        },
      };

      await runSend();

      expect(clientOptions).toEqual([
        expect.objectContaining({
          bffBaseUrl: "https://bff.example.com/agent-intent",
          keycloak: expect.objectContaining({ baseUrl: "https://keycloak.example.com/" }),
        }),
      ]);
    });

    it("leaves Keycloak to the environment default when the profile has no override", async () => {
      await runSend();

      expect(clientOptions[0]).not.toHaveProperty("keycloak");
    });

    it.each([
      ["bffBaseUrl", "BFF URL", "https://user:secret@bff.example.com/"],
      ["bffBaseUrl", "BFF URL", "file:///etc/agent-intent"],
      ["keycloakBaseUrl", "Keycloak URL", "not a url"],
    ])(
      "refuses an invalid stored %s before reading the key or sending",
      async (field, label, url) => {
        profiles = { bot: { ...enrolledProfile, [field]: url } };

        await expect(runSend()).rejects.toThrow(
          `Agent Intent profile "bot" has an invalid stored ${label}`,
        );
        expect(secretKeyReads).toBe(0);
        expect(clientOptions).toEqual([]);
      },
    );

    it("reports a missing keychain key without contacting the service", async () => {
      secretKeyImpl = async () => null;

      await expect(runSend()).rejects.toThrow(
        /No agent key found in the OS keychain for profile "bot"/,
      );
      expect(clientOptions).toEqual([]);
    });

    it("reports a corrupt keychain entry actionably", async () => {
      secretKeyImpl = async () => {
        throw new AgentIntentCorruptKeychainError("Corrupt keychain entry for profile bot.");
      };

      await expect(runSend()).rejects.toThrow(/Corrupt keychain entry.*Re-enroll/s);
    });

    it("catches a keychain key that doesn't belong to the profile before submitting", async () => {
      secretKeyImpl = async () => OTHER_AGENT.exportSecretKey();

      await expect(runSend()).rejects.toThrow(/does not match its recorded public key/);
      expect(clientOptions).toEqual([]);
    });
  });

  describe("--dry-run", () => {
    it("validates and prints the intent without reading the keychain or submitting", async () => {
      await runSend({ "dry-run": true, output: "json" });

      expect(secretKeyReads).toBe(0);
      expect(clientOptions).toEqual([]);
      expect(jsonResult()).toMatchObject({
        dryRun: true,
        submitted: false,
        amount: "10000000000000000",
      });
      expect(jsonResult()).not.toHaveProperty("deeplink");
    });

    it("runs the SDK's own intent validation, so it rejects what a real submit would", async () => {
      await expect(runSend({ "dry-run": true, description: "x".repeat(281) })).rejects.toThrow(
        /Invalid intent: .*description/i,
      );
      expect(secretKeyReads).toBe(0);
    });

    it("still rejects invalid input", async () => {
      await expect(runSend({ "dry-run": true, amount: "0 ETH" })).rejects.toThrow(
        /greater than zero/,
      );
    });
  });

  describe("service responses", () => {
    it("maps a service rejection to an actionable message", async () => {
      createSendIntentImpl = async () => {
        throw new AgentIntentHttpError(
          "The intent issuer does not match the authenticated agent.",
          403,
          "pubkey_mismatch",
        );
      };

      await expect(runSend()).rejects.toThrow(
        /issuer does not match the authenticated agent.*Re-enroll/s,
      );
    });

    it("submits exactly once — no retry on a service error", async () => {
      createSendIntentImpl = async () => {
        throw new AgentIntentHttpError("down", 503);
      };

      await expect(runSend()).rejects.toThrow(/may still have been created/);
      expect(submittedIntents).toHaveLength(1);
    });

    it("succeeds with a warning, not an error, when the service accepted the intent but its link is unreadable", async () => {
      createSendIntentImpl = async () => {
        throw new AgentIntentSdkError("BFF returned an invalid intent deeplink.");
      };

      await runSend({ output: "json" });

      expect(jsonResult()).toMatchObject({
        status: "success",
        submitted: true,
        intentId: null,
        deeplink: null,
      });
      expect(stderr.join("")).toMatch(/accepted the intent.*don't re-run/s);
    });

    it("prints no review link in human output when none came back", async () => {
      createSendIntentImpl = async () => {
        throw new AgentIntentSdkError("BFF returned an invalid intent deeplink.");
      };

      await runSend();

      expect(stdout.join("")).toContain("Intent proposed for human review");
      expect(stdout.join("")).not.toContain("null");
    });

    it("succeeds with a null intent id and a warning when the link has an unexpected shape", async () => {
      createSendIntentImpl = async () => "https://app.agents.ledger-test.com/review?id=abc";

      await runSend({ output: "json" });

      expect(jsonResult()).toMatchObject({ intentId: null, submitted: true });
      expect(stderr.join("")).toContain("no intent id could be extracted");
    });
  });

  describe("redaction", () => {
    it("never prints the profile's secret key, on success or failure", async () => {
      await runSend();
      await runSend({ output: "json" });
      await runSend({ "dry-run": true });
      createSendIntentImpl = async () => {
        throw new AgentIntentHttpError(`body echoing ${SECRET_KEY}`, 500);
      };
      await runSend().catch(e => stderr.push(String(e)));

      expect([...stdout, ...stderr].join("")).not.toContain(SECRET_KEY);
    });
  });

  describe("with the real SDK client over a fake transport", () => {
    it("re-authenticates once on a 401 and sends the exact amount and ERC-20 asset on the wire", async () => {
      const posts: Array<{ authorization: string | null; body: string }> = [];
      const tokens: string[] = [];
      makeClient = options =>
        realAgentIntentSdk.createAgentIntentClient({
          ...(options as Parameters<typeof realAgentIntentSdk.createAgentIntentClient>[0]),
          tokenProvider: {
            async withAccessToken(query, retryWhen) {
              tokens.push("t1");
              const first = await query("t1");
              if (!retryWhen?.(first)) return first;
              tokens.push("t2");
              return query("t2");
            },
          },
          fetch: (async (_url: unknown, init?: RequestInit) => {
            posts.push({
              authorization: new Headers(init?.headers).get("authorization"),
              body: String(init?.body),
            });
            return posts.length === 1
              ? new Response("expired", { status: 401 })
              : new Response("https://bff.example.com/intents/wire-1", { status: 200 });
          }) as typeof fetch,
        });

      await runSend({
        amount: "123456789.123456 USDC",
        token: USDC,
        output: "json",
      });

      expect(tokens).toEqual(["t1", "t2"]);
      expect(posts.map(p => p.authorization)).toEqual(["Bearer t1", "Bearer t2"]);
      const body = posts[1]?.body ?? "";
      expect(body).toContain('"amount":123456789123456');
      expect(body).toContain('"type":"erc20"');
      expect(body.toLowerCase()).toContain(USDC.slice(2).toLowerCase());
      expect(body).not.toContain(SECRET_KEY);
      // The SDK rebases the service's link onto the environment's own frontend.
      expect(jsonResult()).toMatchObject({
        intentId: "wire-1",
        deeplink: "https://app.agents.ledger-test.com/intents/wire-1",
      });
    });

    it("puts an amount above 2^53 on the wire as its exact integer digits", async () => {
      const bodies: string[] = [];
      makeClient = options =>
        realAgentIntentSdk.createAgentIntentClient({
          ...(options as Parameters<typeof realAgentIntentSdk.createAgentIntentClient>[0]),
          tokenProvider: realAgentIntentSdk.staticAccessTokenProvider("t"),
          fetch: (async (_url: unknown, init?: RequestInit) => {
            bodies.push(String(init?.body));
            return new Response("https://bff.example.com/intents/big-1", { status: 200 });
          }) as typeof fetch,
        });

      await runSend({ amount: "123456789.123456789123456789 ETH", output: "json" });

      const exact = "123456789123456789123456789";
      expect(BigInt(exact) > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(bodies).toEqual([expect.stringMatching(new RegExp(`"amount":${exact}[,}]`))]);
      expect(jsonResult()).toMatchObject({ amount: exact, submitted: true });
    });
  });
});
