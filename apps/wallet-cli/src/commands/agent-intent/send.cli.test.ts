import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  spyOn,
  type Mock,
} from "bun:test";
import { buildAttestation, createSoftwareAgentIdentity } from "@ledgerhq/agent-intent-sdk";
import { toChecksumAddress } from "../../agent-intent/evm";
import {
  FakeAgentIntentService,
  makeEnrolledProfile,
  type EnrolledProfile,
} from "../../testing/agent-intent-service";
import {
  FakeCal,
  solanaMintsRoute,
  submittedIntents,
  type CalToken,
} from "../../testing/agent-intent-proposals";
import { useFreshCalCache } from "../../testing/cal-cache";
import { KEYCLOAK_TOKEN } from "../../testing/auth-routes";
import { USDT_CONTRACT } from "../../testing/cal-fixtures";
import { runCli } from "../../testing/cli-runner";
import { MockServer } from "../../testing/mock-server";
import { WalletAdapter } from "../../wallet";
import { BalanceSchema, type AccountBalances } from "../../wallet/models";

// EIP-55 specification vectors, so checksums are known-good.
const SENDER = "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed";
const RECIPIENT = "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359";
// The 0x11 × 32 and 0x22 × 32 keys of agent-intent-service ADR-0002's Solana vectors.
const SOL_SENDER = "29d2S7vB453rNYFdR5Ycwt7y9haRT5fwVwL9zTmBhfV2";
const SOL_RECIPIENT = "3JF3sEqM796hk5WFqA6EtmEwJQ9quALszsfJyvXNQKy3";
const BTC_XPUB =
  "xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiKrhko4egpiMZbpiaQL2jkwSB1icqYh2cfDfVxdx4df189oLKnC5fSwqPfgyP3hooxujYzAu3fDVmz";
const DEEPLINK = "https://app.agents.ledger-test.com/intents/intent-123";

// Ids as CAL gives them, since the process-wide CAL cache keeps what each test is answered.
const erc20 = (id: string, address: string, ticker: string, name: string): CalToken => ({
  id: `ethereum/erc20/${id}`,
  network: "ethereum",
  address: toChecksumAddress(address),
  ticker,
  name,
  decimals: 6,
});
const spl = (address: string, ticker: string, name: string): CalToken => ({
  id: `solana/spl/${address.toLowerCase()}`,
  network: "solana",
  address,
  ticker,
  name,
  decimals: 6,
});

const USDT = erc20("usd_tether__erc20_", USDT_CONTRACT, "USDT", "Tether USD");
const USDC = erc20("usd__coin", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "USDC", "USD Coin");
// Two ERC-20s CAL lists under the PEPE ticker.
const PEPE = erc20("pepe", "0x6982508145454ce325ddbe47a25d4ec3d2311933", "PEPE", "Pepe");
const PEPE_COPY = erc20(
  "pepe_0xbe042e",
  "0xbe042e9d09cb588331ff911c2b46fd833a3e5bd6",
  "PEPE",
  "Pepe_0xbe042e",
);
// USDC is a classic SPL Token mint, PYUSD a Token-2022 one.
const USDC_MINT = spl("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "USDC", "USD Coin");
const PYUSD_MINT = spl("2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo", "PYUSD", "PayPal USD");
// EURC mints of both programs, for the tokens a Solana account holds.
const EURC_MINT = spl("EurcC1assicMint11111111111111111111111111111", "EURC", "Euro Coin");
const EURC_2022_MINT = spl("Eurc2o22Mint1111111111111111111111111111111", "EURC", "Euro Coin 2022");
const EURC_2022_COPY = spl("Eurc2o22Copy1111111111111111111111111111111", "EURC", "Euro Coin copy");
// A mint CAL lists that the node can't confirm as a token mint.
const GHOST_MINT = spl("GhostMint11111111111111111111111111111111111", "GHOST", "Ghost");

const service = new FakeAgentIntentService();
const cal = new FakeCal([
  USDT,
  USDC,
  PEPE,
  PEPE_COPY,
  USDC_MINT,
  PYUSD_MINT,
  EURC_MINT,
  EURC_2022_MINT,
  EURC_2022_COPY,
  GHOST_MINT,
]);
const server = new MockServer([
  ...service.routes,
  ...cal.routes,
  solanaMintsRoute({
    [USDC_MINT.address]: "spl-token",
    [EURC_MINT.address]: "spl-token",
    [PYUSD_MINT.address]: "spl-token-2022",
    [EURC_2022_MINT.address]: "spl-token-2022",
    [EURC_2022_COPY.address]: "spl-token-2022",
  }),
]);
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
  { label: "bitcoin-native-1", descriptor: `account:2:utxo:bitcoin:${BTC_XPUB}:m/84h/0h/0h` },
];
let fixture: EnrolledProfile;
let env: Record<string, string>;
let restoreCalCache: () => void;
let accountBalances: Mock<WalletAdapter["getAccountBalances"]>;

beforeAll(async () => {
  server.start();
  fixture = await makeEnrolledProfile({ accounts });
  env = { ...fixture.env, WALLET_CLI_MOCK_PORT: String(server.port) };
});
afterAll(() => {
  fixture.cleanup();
  server.stop();
});
beforeEach(() => {
  restoreCalCache = useFreshCalCache();
  service.reset();
  service.reply("createIntent", { text: "https://bff.example.com/intents/intent-123" });
  cal.tickerSearches.length = 0;
  // The tokens a --account holds come from its sync; by default, none.
  accountBalances = spyOn(WalletAdapter.prototype, "getAccountBalances").mockResolvedValue(holds());
});
afterEach(() => {
  restoreCalCache();
  accountBalances.mockRestore();
  fixture.keychain.readError = undefined;
});

function holds(...tokens: CalToken[]): AccountBalances {
  const native = { kind: "native", assetId: "native", balance: "1" };
  const held = tokens.map(token => ({
    kind: "token",
    assetId: token.id,
    balance: "1",
    token: {
      id: token.id,
      ticker: token.ticker,
      name: token.name,
      contractAddress: token.address,
      parentCurrencyId: token.network,
      tokenType: token.network === "ethereum" ? "erc20" : "spl",
      decimals: token.decimals,
      unit: { name: token.ticker, code: token.ticker, magnitude: token.decimals },
    },
  }));
  return { balances: [native, ...held].map(b => BalanceSchema.parse(b)), skippedTokenIds: [] };
}

function send(...args: string[]) {
  return runCli(["agent-intent", "send", "--profile", "bot", ...args], env);
}

async function sendJson(...args: string[]) {
  const run = await send(...args, "--output", "json");
  return { ...run, json: JSON.parse(run.stdout) };
}

const fromEth = (amount: string, ...args: string[]) => [
  "--from",
  SENDER,
  "--to",
  RECIPIENT,
  "--amount",
  amount,
  ...args,
];
const fromSol = (amount: string, ...args: string[]) => [
  "--from",
  SOL_SENDER,
  "--to",
  SOL_RECIPIENT,
  "--amount",
  amount,
  ...args,
];
const fromAccount = (label: string, to: string, amount: string, ...args: string[]) => [
  "--account",
  label,
  "--to",
  to,
  "--amount",
  amount,
  ...args,
];

const intent = () => submittedIntents(service)[0]?.intent;
/** A send carries EVM addresses as lowercase hex without `0x`. */
const onWire = (address: string) => address.slice(2).toLowerCase();

describe("agent-intent send (CLI)", () => {
  it("proposes native ETH in exact base units, signed by the profile's agent", async () => {
    const { json, exitCode, stderr } = await sendJson(...fromEth("0.01 ETH"));

    expect(exitCode, stderr).toBe(0);
    expect(json).toMatchObject({
      status: "success",
      command: "agent-intent send",
      network: "ethereum",
      // The SDK rebases the service's link onto the environment's own frontend.
      intentId: "intent-123",
      deeplink: DEEPLINK,
      profileId: "bot",
      sender: SENDER,
      recipient: RECIPIENT,
      asset: { type: "native", ticker: "ETH", decimals: 18 },
      amount: "10000000000000000",
      // No --fee-strategy: Ethereum defaults to medium.
      feeStrategy: "medium",
      submitted: true,
    });
    expect(submittedIntents(service)).toEqual([
      {
        issuer: fixture.agent.publicKey,
        signatureValid: true,
        intent: {
          type: "send",
          network: "ethereum",
          sender: onWire(SENDER),
          recipient: onWire(RECIPIENT),
          amount: "10000000000000000",
          asset: { type: "native" },
          feeStrategy: "medium",
        },
      },
    ]);
    expect(service.signIns).toEqual([
      {
        publicKey: fixture.agent.publicKey,
        attestation: buildAttestation(fixture.trustchainId),
        signatureValid: true,
      },
    ]);
    expect(service.calls("createIntent")[0]?.authorization).toBe(`Bearer ${KEYCLOAK_TOKEN}`);
  });

  it("shows the review link, network and fee, and says nothing was signed or broadcast", async () => {
    const { stdout } = await send(...fromEth("0.01 ETH"));

    expect(stdout).toContain(DEEPLINK);
    expect(stdout).toContain("no transaction was signed or broadcast");
    expect(stdout).toContain("Intent:  intent-123");
    expect(stdout).toContain("Network: Ethereum mainnet");
    expect(stdout).toContain("Amount:  0.01 ETH");
    expect(stdout).toContain("Fee:     medium");
    expect(stdout).not.toContain("Memo:");
  });

  it("passes the fee level and description through", async () => {
    await send(...fromEth("0.01 ETH", "--fee-strategy", "fast", "--description", "Monthly rent"));

    expect(intent()).toMatchObject({ feeStrategy: "fast", description: "Monthly rent" });
  });

  it("sends from an --account label an amount beyond 2^53, exact on the wire", async () => {
    const exact = "123456789123456789123456789";

    const { json } = await sendJson(
      ...fromAccount("ethereum-1", RECIPIENT, "123456789.123456789123456789 ETH"),
    );

    expect(json).toMatchObject({ sender: SENDER, amount: exact, submitted: true });
    expect(intent()).toMatchObject({ sender: onWire(SENDER), amount: exact });
    expect(service.calls("createIntent")[0]?.body).toMatch(new RegExp(`"amount":${exact}[,}]`));
  });

  it("proposes native SOL in lamports, with its memo and no fee level", async () => {
    const { json, exitCode, stderr } = await sendJson(
      ...fromSol("0.5 SOL", "--memo", "Invoice 42", "--description", "Pay supplier"),
    );

    expect(exitCode, stderr).toBe(0);
    expect(submittedIntents(service)).toEqual([
      {
        issuer: fixture.agent.publicKey,
        signatureValid: true,
        intent: {
          type: "send",
          network: "solana",
          sender: SOL_SENDER,
          recipient: SOL_RECIPIENT,
          amount: "500000000",
          asset: { type: "native" },
          memo: "Invoice 42",
          description: "Pay supplier",
        },
      },
    ]);
    expect(json).toMatchObject({
      status: "success",
      network: "solana",
      asset: { type: "native", ticker: "SOL", decimals: 9 },
      amount: "500000000",
      memo: "Invoice 42",
      submitted: true,
    });
    expect(json).not.toHaveProperty("feeStrategy");
  });

  it("previews SOL from a Solana label with its network and memo, and no fee level", async () => {
    const { stdout, exitCode, stderr } = await send(
      ...fromAccount("solana-1", SOL_RECIPIENT, "0.5 SOL", "--memo", "Invoice 42", "--dry-run"),
    );

    expect(exitCode, stderr).toBe(0);
    expect(stdout).toContain("Dry run — intent validated, nothing was submitted.");
    expect(stdout).toContain(`From:    ${SOL_SENDER}`);
    expect(stdout).toContain("Network: Solana mainnet");
    expect(stdout).toContain("Amount:  0.5 SOL");
    expect(stdout).toContain("Memo:    Invoice 42");
    expect(stdout).not.toContain("Fee:");
  });

  it("proposes an SPL mint, checked on chain, in the token's base units", async () => {
    const { json } = await sendJson(
      ...fromSol("25.5 USDC", "--token", USDC_MINT.address, "--memo", "Invoice 42"),
    );

    expect(intent()).toEqual({
      type: "send",
      network: "solana",
      sender: SOL_SENDER,
      recipient: SOL_RECIPIENT,
      amount: "25500000",
      asset: { type: "spl-token", assetReference: USDC_MINT.address },
      memo: "Invoice 42",
    });
    expect(json).toMatchObject({
      network: "solana",
      asset: { type: "spl-token", ticker: "USDC", decimals: 6, mint: USDC_MINT.address },
      amount: "25500000",
      displayAmount: "25.5",
    });
  });

  it("names the SPL token and its mint when previewing from a Solana label", async () => {
    const { stdout } = await send(
      ...fromAccount("solana-1", SOL_RECIPIENT, "25.5 USDC", "--token", USDC_MINT.address),
      "--dry-run",
    );

    expect(stdout).toContain(`Amount:  25.5 USDC (${USDC_MINT.address})`);
  });

  it("proposes an ERC-20 from its contract, checksummed, without looking the ticker up", async () => {
    const { json } = await sendJson(...fromEth("25.5 USDT", "--token", USDT_CONTRACT));

    expect(intent()).toMatchObject({
      amount: "25500000",
      asset: { type: "erc20", assetReference: onWire(USDT_CONTRACT) },
    });
    expect(json).toMatchObject({
      asset: { type: "erc20", ticker: "USDT", decimals: 6, contract: USDT.address },
      amount: "25500000",
      displayAmount: "25.5",
    });
    expect(cal.tickerSearches).toEqual([]);
  });

  it("names the ERC-20 and its contract in human output", async () => {
    const { stdout } = await send(...fromEth("25 USDT", "--token", USDT.address));

    expect(stdout).toContain(`Amount:  25 USDT (${USDT.address})`);
  });

  it("signs in again once when the service answers 401", async () => {
    service.reply(
      "createIntent",
      { status: 401, text: "expired" },
      { text: "https://bff.example.com/intents/wire-1" },
    );

    const { json } = await sendJson(...fromEth("1 USDT", "--token", USDT.address));

    expect(service.calls("createIntent")).toHaveLength(2);
    expect(service.signIns.map(s => s.publicKey)).toEqual([
      fixture.agent.publicKey,
      fixture.agent.publicKey,
    ]);
    expect(json).toMatchObject({ intentId: "wire-1", submitted: true });
  });

  describe("token from the --amount ticker, without --token", () => {
    it("takes the token the --account holds, checksummed, before any ticker search", async () => {
      accountBalances.mockResolvedValue({
        ...holds({ ...PEPE, address: PEPE.address.toLowerCase() }),
        skippedTokenIds: ["ethereum/erc20/no_units"],
      });

      const { stderr } = await sendJson(...fromAccount("ethereum-1", RECIPIENT, "1 pepe"));

      expect(intent()).toMatchObject({
        asset: { type: "erc20", assetReference: onWire(PEPE.address) },
      });
      expect(cal.tickerSearches).toEqual([]);
      expect(stderr).toContain(`PEPE is ${PEPE.address} (Pepe), held by "ethereum-1".`);
      expect(stderr).toContain(
        "⚠ Skipped token ethereum/erc20/no_units: the Crypto Assets List gives no unit for it.",
      );
    });

    it.each([
      ["the SPL token", [USDC_MINT], "25 USDC", USDC_MINT],
      ["the classic mint among two", [EURC_2022_MINT, EURC_MINT], "25 EURC", EURC_MINT],
    ])("takes %s a Solana --account holds", async (_, held, amount, expected) => {
      accountBalances.mockResolvedValue(holds(...held));

      await send(...fromAccount("solana-1", SOL_RECIPIENT, amount));

      expect(intent()).toMatchObject({
        network: "solana",
        asset: { type: "spl-token", assetReference: expected.address },
      });
      expect(cal.tickerSearches).toEqual([]);
    });

    it.each([
      [
        "the only Token-2022 mint a Solana --account holds",
        "solana-1",
        [EURC_2022_MINT],
        "25 EURC",
        `${EURC_2022_MINT.address} (EURC) is a Token-2022 mint, which Agent Intent can't send yet.`,
      ],
      [
        "several Token-2022 mints a Solana --account holds",
        "solana-1",
        [EURC_2022_MINT, EURC_2022_COPY],
        "25 EURC",
        'Account "solana-1" holds several SPL tokens with the ticker EURC:\n' +
          `  ${EURC_2022_MINT.address} (Euro Coin 2022)\n` +
          `  ${EURC_2022_COPY.address} (Euro Coin copy)\n` +
          "Pass the one to send with --token.",
      ],
      [
        "several tokens with the ticker an --account holds",
        "ethereum-1",
        [PEPE, PEPE_COPY],
        "1 PEPE",
        'Account "ethereum-1" holds several ERC-20 tokens with the ticker PEPE:\n' +
          `  ${PEPE.address} (Pepe)\n  ${PEPE_COPY.address} (Pepe_0xbe042e)\n` +
          "Pass the one to send with --token.",
      ],
    ])("refuses %s rather than searching CAL", async (_, label, held, amount, message) => {
      accountBalances.mockResolvedValue(holds(...held));
      const to = label === "ethereum-1" ? RECIPIENT : SOL_RECIPIENT;

      const { json, exitCode } = await sendJson(...fromAccount(label, to, amount));

      expect(exitCode).toBe(1);
      expect(json.error.message).toContain(message);
      expect(cal.tickerSearches).toEqual([]);
      expect(service.requests).toEqual([]);
    });

    it.each([
      [
        "can't read the tokens it holds, saying why",
        () => accountBalances.mockRejectedValue(new Error("RPC unreachable")),
        'Couldn\'t read the tokens account "ethereum-1" holds (RPC unreachable), so USDC is ' +
          "looked up in the Crypto Assets List instead.",
      ],
      [
        "holds no token with the ticker",
        () => accountBalances.mockResolvedValue(holds(PEPE)),
        "USDC is " + USDC.address + " (USD Coin), the only ERC-20 token",
      ],
    ])("searches CAL when the --account %s", async (_, setUp, notice) => {
      setUp();

      const { stderr } = await send(...fromAccount("ethereum-1", RECIPIENT, "25 USDC"));

      expect(intent()).toMatchObject({
        asset: { type: "erc20", assetReference: onWire(USDC.address) },
      });
      expect(cal.tickerSearches).toEqual(["ethereum USDC"]);
      expect(stderr).toContain(notice);
    });

    it("takes the only ERC-20 CAL lists under the ticker for a 0x --from", async () => {
      const { json, stderr } = await sendJson(...fromEth("25.5 usdc"));

      expect(intent()).toMatchObject({
        amount: "25500000",
        asset: { type: "erc20", assetReference: onWire(USDC.address) },
      });
      expect(json).toMatchObject({
        network: "ethereum",
        asset: { type: "erc20", ticker: "USDC", contract: USDC.address },
      });
      // CAL matches tickers case-sensitively: searched as typed, then uppercase.
      expect(cal.tickerSearches).toEqual(["ethereum usdc", "ethereum USDC"]);
      expect(stderr).toContain(
        `USDC is ${USDC.address} (USD Coin), the only ERC-20 token with that ticker on Ethereum mainnet.`,
      );
    });

    it.each([
      ["a base58 --from", ["--from", SOL_SENDER]],
      ["a Solana --account", ["--account", "solana-1"]],
    ])("sends the SPL token CAL lists on Solana for %s", async (_, sender) => {
      const { json } = await sendJson(...sender, "--to", SOL_RECIPIENT, "--amount", "25 USDC");

      expect(intent()).toMatchObject({
        network: "solana",
        asset: { type: "spl-token", assetReference: USDC_MINT.address },
      });
      expect(json).toMatchObject({ network: "solana" });
      expect(cal.tickerSearches).toEqual(["solana USDC"]);
    });
  });

  describe("rejected before the agent key is read", () => {
    beforeEach(() => {
      fixture.keychain.readError = new Error("the agent key was read");
    });

    it.each<[string, string[], string | RegExp, string[]?]>([
      // Sender
      [
        "no sender",
        ["--to", RECIPIENT, "--amount", "1 ETH"],
        "Pass exactly one sender: --account <session-label> or --from <address>.",
      ],
      ["two senders", ["--account", "ethereum-1", ...fromEth("1 ETH")], "Pass exactly one sender"],
      [
        "an unknown label",
        fromAccount("ethereum-9", RECIPIENT, "1 ETH"),
        'No account labeled "ethereum-9"',
      ],
      [
        "a Bitcoin label",
        fromAccount("bitcoin-native-1", RECIPIENT, "1 ETH"),
        /on bitcoin; this Agent Intent send needs an Ethereum mainnet account/,
      ],
      [
        "a Solana devnet label",
        fromAccount("solana_devnet-1", SOL_RECIPIENT, "25 USDC"),
        /on solana_devnet; this Agent Intent send needs a Solana mainnet account/,
        [],
      ],
      [
        "an Ethereum label for SOL",
        fromAccount("ethereum-1", SOL_RECIPIENT, "0.5 SOL"),
        'Account "ethereum-1" is on ethereum, but SOL is a native Solana send. To send a token with that ticker from this account, pass its address with --token.',
      ],
      [
        "a Solana label for ETH",
        fromAccount("solana-1", RECIPIENT, "1 ETH"),
        'Account "solana-1" is on solana, but ETH is a native Ethereum send. To send a token with that ticker from this account, pass its address with --token.',
        [],
      ],
      [
        "an Ethereum label for a base58 --token",
        fromAccount("ethereum-1", SOL_RECIPIENT, "25.5 USDC", "--token", USDC_MINT.address),
        /on ethereum; this Agent Intent send needs a Solana mainnet account/,
      ],
      [
        "a malformed Solana label",
        fromAccount("solana-corrupt", SOL_RECIPIENT, "0.5 SOL"),
        'Invalid intent: account "solana-corrupt" must be a 32-byte base58 address.',
      ],
      [
        "a short --from",
        ["--from", "0x1234", "--to", RECIPIENT, "--amount", "1 ETH"],
        /--from .*not an EVM address/,
      ],
      [
        "a base58 --from for ETH",
        ["--from", SOL_SENDER, "--to", RECIPIENT, "--amount", "1 ETH"],
        /--from .*not an EVM address/,
      ],
      [
        "a --from of neither network",
        ["--from", SENDER.slice(2, 30), "--to", RECIPIENT, "--amount", "25 USDC"],
        `--from ${SENDER.slice(2, 30)} is neither an EVM address (0x…) nor a Solana one (base58), so it names no network for the token.`,
        [],
      ],
      [
        "a malformed Solana --from",
        fromSol("0.5 SOL").map(a => (a === SOL_SENDER ? `${SOL_SENDER}11` : a)),
        "Invalid intent: --from must be a 32-byte base58 address.",
      ],
      // Recipient
      [
        "a bad EIP-55 checksum",
        fromEth("1 ETH").map(a => (a === RECIPIENT ? RECIPIENT.replace("fB69", "Fb69") : a)),
        /--to .*invalid EIP-55 checksum/,
      ],
      [
        "a non-base58 Solana --to",
        fromSol("0.5 SOL").map(a => (a === SOL_RECIPIENT ? `${SOL_RECIPIENT.slice(0, -1)}0` : a)),
        "Invalid intent: --to must be base58.",
      ],
      [
        "an EVM --to for SOL",
        fromSol("0.5 SOL").map(a => (a === SOL_RECIPIENT ? RECIPIENT : a)),
        "Invalid intent: --to must be base58.",
      ],
      // Network flags
      [
        "a fee level on Solana",
        fromSol("0.5 SOL", "--fee-strategy", "fast"),
        "--fee-strategy is Ethereum only: on Solana the service sets the fee.",
      ],
      [
        "a fee level on an SPL send",
        fromSol("25.5 USDC", "--token", USDC_MINT.address, "--fee-strategy", "fast"),
        "--fee-strategy is Ethereum only",
      ],
      ["a memo on Ethereum", fromEth("1 ETH", "--memo", "Invoice 42"), "--memo is Solana only."],
      // Amount
      ["a zero ETH amount", fromEth("0 ETH", "--dry-run"), "Amount must be greater than zero."],
      ["a zero SOL amount", fromSol("0 SOL"), "Amount must be greater than zero."],
      ["more decimals than SOL has", fromSol("0.0000000001 SOL"), "SOL supports at most 9"],
      [
        "more decimals than an ERC-20 has",
        fromEth("1.0000001 USDT", "--token", USDT.address),
        /7 decimal places, but USDT supports at most 6/,
      ],
      [
        "more decimals than an SPL token has",
        fromSol("1.0000001 USDC", "--token", USDC_MINT.address),
        "7 decimal places, but USDC supports at most 6",
      ],
      // --token
      [
        "a contract CAL doesn't know",
        fromEth("1 XYZ", "--token", "0x0000000000000000000000000000000000000001"),
        /not a known ERC-20 token on Ethereum mainnet/,
      ],
      [
        "a ticker that isn't the contract's",
        fromEth("25 USDC", "--token", USDT_CONTRACT),
        `--amount is in USDC, but --token ${USDT.address} is USDT. Fix whichever one is wrong.`,
      ],
      [
        "an ERC-20 whose ticker is SOL",
        fromEth("5 SOL", "--token", USDT.address),
        `--amount is in SOL, but --token ${USDT.address} is USDT.`,
      ],
      [
        "a --token of neither network",
        fromEth("25 USDC", "--token", "usdc"),
        "--token usdc is neither an EVM address (0x…) nor a Solana one (base58), so it names no network for the token.",
      ],
      [
        "a Token-2022 --token",
        fromSol("1 PYUSD", "--token", PYUSD_MINT.address),
        `--token ${PYUSD_MINT.address} (PYUSD) is a Token-2022 mint, which Agent Intent can't send yet.`,
      ],
      [
        "a mint CAL doesn't know",
        fromSol("1 XYZ", "--token", SOL_RECIPIENT),
        `--token ${SOL_RECIPIENT} is not a known SPL token on Solana mainnet.`,
      ],
      [
        "a ticker that isn't the mint's",
        fromSol("25 USDT", "--token", USDC_MINT.address),
        `--amount is in USDT, but --token ${USDC_MINT.address} is USDC.`,
      ],
      [
        "a mint the node can't confirm",
        fromSol("1 GHOST", "--token", GHOST_MINT.address),
        `--token ${GHOST_MINT.address} (GHOST) isn't a mint of the SPL Token program on Solana mainnet.`,
      ],
      // Ticker search
      [
        "a ticker CAL lists twice",
        fromEth("1 PEPE"),
        `Several ERC-20 tokens on Ethereum mainnet have the ticker PEPE:\n  ${PEPE.address} (Pepe)\n  ${PEPE_COPY.address} (Pepe_0xbe042e)\nPass the one to send with --token.`,
        ["ethereum PEPE"],
      ],
      [
        "a ticker CAL doesn't list",
        fromEth("1 XYZ"),
        "No ERC-20 token on Ethereum mainnet has the ticker XYZ in the Crypto Assets List, which matches tickers case-sensitively (e.g. USDe, stETH). Check the ticker, or pass the token's address with --token.",
        ["ethereum XYZ"],
      ],
      [
        "a Token-2022 mint found by ticker",
        fromSol("1 PYUSD"),
        `${PYUSD_MINT.address} (PYUSD) is a Token-2022 mint, which Agent Intent can't send yet.`,
        ["solana PYUSD"],
      ],
      // Profile
      [
        "an unknown profile",
        ["--profile", "nope", ...fromEth("1 ETH")],
        /No Agent Intent profile named "nope"/,
      ],
    ])("rejects %s", async (_, args, message, searched = []) => {
      const { json, exitCode } = await sendJson(...args);

      expect(exitCode).toBe(1);
      if (typeof message === "string") expect(json.error.message).toContain(message);
      else expect(json.error.message).toMatch(message);
      expect(service.requests).toEqual([]);
      expect(service.signIns).toEqual([]);
      expect(cal.tickerSearches).toEqual(searched);
    });

    it("validates a dry run and prints the intent without reading the key or submitting", async () => {
      const { json, exitCode, stderr } = await sendJson(...fromEth("0.01 ETH", "--dry-run"));

      expect(exitCode, stderr).toBe(0);
      expect(json).toMatchObject({
        dryRun: true,
        submitted: false,
        sender: SENDER,
        amount: "10000000000000000",
      });
      expect(json).not.toHaveProperty("deeplink");
      expect(service.requests).toEqual([]);
    });
  });

  describe("profile and agent key", () => {
    async function sendAs(pending: EnrolledProfile) {
      const run = await runCli(
        ["agent-intent", "send", "--profile", "bot", ...fromEth("1 ETH"), "--output", "json"],
        { ...pending.env, WALLET_CLI_MOCK_PORT: String(server.port) },
      );
      return { ...run, json: JSON.parse(run.stdout) };
    }

    it.each([
      [{ trustchainId: undefined }, /not enrolled yet.*agent-intent enroll/s],
      [{ bffBaseUrl: "https://user:secret@bff.example.com/" }, /has an invalid stored BFF URL/],
      [{ bffBaseUrl: "file:///etc/agent-intent" }, /has an invalid stored BFF URL/],
      [{ keycloakBaseUrl: "not a url" }, /has an invalid stored Keycloak URL/],
    ])("refuses the stored profile %j before reading its key", async (profile, message) => {
      const pending = await makeEnrolledProfile({ profile });
      pending.keychain.readError = new Error("the agent key was read");
      try {
        const { json, exitCode } = await sendAs(pending);

        expect(exitCode).toBe(1);
        expect(json.error.message).toMatch(message);
        expect(service.requests).toEqual([]);
      } finally {
        pending.cleanup();
      }
    });

    it.each([
      ["missing", () => undefined, /No agent key found in the OS keychain for profile "bot"/],
      ["password-protected", () => "ENC:00", /is password-protected.*Re-enroll/s],
      [
        "another agent's",
        () => createSoftwareAgentIdentity().exportSecretKey(),
        /OS keychain key of profile "bot" does not match its recorded public key/,
      ],
    ])("reports a %s agent key without contacting the service", async (_, storedKey, message) => {
      const pending = await makeEnrolledProfile();
      for (const entry of pending.keychain.entries.keys()) {
        const key = storedKey();
        if (key === undefined) pending.keychain.entries.delete(entry);
        else pending.keychain.entries.set(entry, key);
      }
      try {
        const { json, exitCode } = await sendAs(pending);

        expect(exitCode).toBe(1);
        expect(json.error.message).toMatch(message);
        expect(service.requests).toEqual([]);
        expect(service.signIns).toEqual([]);
      } finally {
        pending.cleanup();
      }
    });
  });

  describe("service answers", () => {
    it("turns a rejection into an actionable message", async () => {
      service.reply("createIntent", {
        status: 403,
        json: {
          message: "The intent issuer does not match the authenticated agent.",
          type: "pubkey_mismatch",
        },
      });

      const { json, exitCode } = await sendJson(...fromEth("0.01 ETH"));

      expect(exitCode).toBe(1);
      expect(json.error.message).toMatch(
        /issuer does not match the authenticated agent.*Re-enroll/s,
      );
    });

    it("submits exactly once, warning that a failed intent may still exist", async () => {
      service.reply("createIntent", { status: 503, json: { message: "down" } });

      const { json, exitCode } = await sendJson(...fromEth("0.01 ETH"));

      expect(exitCode).toBe(1);
      expect(json.error.message).toMatch(/may still have been created/);
      expect(service.calls("createIntent")).toHaveLength(1);
    });

    it("succeeds with a warning, not an error, when the review link is unreadable", async () => {
      service.reply("createIntent", { text: "not a link" });

      const json = await sendJson(...fromEth("0.01 ETH"));
      const human = await send(...fromEth("0.01 ETH"));

      expect(json.exitCode).toBe(0);
      expect(json.json).toMatchObject({
        status: "success",
        submitted: true,
        intentId: null,
        deeplink: null,
      });
      expect(json.stderr).toMatch(/accepted the intent.*don't re-run/s);
      expect(human.stdout).toContain("Intent proposed for human review");
      expect(human.stdout).not.toContain("null");
    });

    it("succeeds with no intent id and a warning when the link has another shape", async () => {
      service.reply("createIntent", { text: "https://bff.example.com/review?id=abc" });

      const { json, stderr } = await sendJson(...fromEth("0.01 ETH"));

      expect(json).toMatchObject({ intentId: null, submitted: true });
      expect(stderr).toContain("no intent id could be extracted");
    });

    it("never prints the agent secret key, on success or failure", async () => {
      const secretKey = fixture.agent.exportSecretKey();
      const runs = [
        await send(...fromEth("0.01 ETH")),
        await sendJson(...fromEth("0.01 ETH")),
        await send(...fromEth("0.01 ETH", "--dry-run")),
      ];
      service.reply("createIntent", { status: 500, text: `body echoing ${secretKey}` });
      runs.push(await send(...fromEth("0.01 ETH")));

      for (const { stdout, stderr } of runs) expect(stdout + stderr).not.toContain(secretKey);
      expect(service.calls("createIntent").every(r => !r.body.includes(secretKey))).toBe(true);
    });
  });
});
