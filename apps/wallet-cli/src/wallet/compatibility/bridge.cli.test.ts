import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { CAL_KNOWS_USDC, USDC_MINT } from "../../testing/agent-intent-cal-routes";
import { useFreshCalCache } from "../../testing/cal-cache";
import { USDT_API_RESPONSE, USDT_CONTRACT } from "../../testing/cal-fixtures";
import { runCli } from "../../testing/cli-runner";
import { ETH_ADDRESS, ETH_DESCRIPTOR } from "../../testing/constants";
import { FakeSolanaRpc } from "../../testing/fake-solana-rpc";
import { FakeSpeculos, solanaApp } from "../../testing/fake-speculos";
import { disposeWalletCliDmkTransportFully } from "../../device/register-dmk-transport";
import { MockServer } from "../../testing/mock-server";
import { makeSessionDir } from "../../testing/session-fixture";

const SOL_ADDRESS = "4pKFxpCN3k97FW5TUNYpJrCXNvGBu4aYGqPESkzi3tmR";
const SOL_DESCRIPTOR = `account:2:address:solana:${SOL_ADDRESS}:m/44h/501h/0h/0h`;
const VALIDATOR = "CertusDeBmqN8ZawdkxK5kFGMwBXdudvWHYwtNgNhvLu";
const ACTIVE_STAKE = "7ewp1mzKTRtGWa3aHqy8bXJ3p9gdGxXaqzX7Jq3WbpGa";
const IDLE_STAKE = "9qaHqsbA3qNHy5BsPpvzQJu5RchqDXiZs1sgy6B8ZTYu";
const SOL_PUBLIC_KEY = "38b200cf06aa0fba002a3cddd8d1432296e41403683d0b250976a7ad518468fc";
const SIGNATURE = "ab".repeat(64);
const SIGNATURE_BASE58 =
  "4S55ApgNWn8YKQL5J2uuxtfZrYXQZqBs8BUJTqGv3us4cAefggxxMLavbor7u47x4BfUhDRkfFBpW2rJTU6YMxux";
/** The associated USDC account of `SOL_ADDRESS`. */
const USDC_ACCOUNT = "8sPj4cMC1MFG7mFw6QzjqtdzNAdxiZGTaqQFc3cddmZm";

/** Amounts are formatted with a no-break space before the ticker. */
const withPlainSpaces = (text: string) => text.replaceAll("\u00a0", " ");

let restoreCalCache: () => void;
beforeEach(() => {
  restoreCalCache = useFreshCalCache();
});
afterEach(() => restoreCalCache());

function runOn(server: MockServer, label: string, descriptor: string, env = {}) {
  return async (...args: string[]) => {
    const fixture = makeSessionDir([{ label, descriptor }]);
    const run = await runCli([...args, "--account", label, "--output", "json"], {
      ...env,
      ...fixture.env,
      WALLET_CLI_MOCK_PORT: String(server.port),
    }).finally(fixture.cleanup);
    // A device command streams NDJSON events before its result.
    return { ...run, json: JSON.parse(run.stdout.split("\n").at(-1) ?? "") };
  };
}

describe("a Solana account, synced through the bridge (CLI)", () => {
  const rpc = new FakeSolanaRpc(SOL_ADDRESS);
  const server = new MockServer([
    ...rpc.routes,
    {
      method: "POST",
      match: "/v3/stakes",
      response: {
        data: [],
        meta: { is_stale: false, stale_at: null, responded_at: "2026-01-01T00:00:00.000Z" },
      },
    },
    ...CAL_KNOWS_USDC,
  ]);
  const solana = runOn(server, "solana-1", SOL_DESCRIPTOR);

  beforeAll(() => server.start());
  afterAll(() => server.stop());
  beforeEach(() => {
    rpc.reset();
    rpc.validators = [VALIDATOR];
  });

  it("lists SOL and the SPL tokens CAL knows", async () => {
    rpc.tokenAccounts = [
      { address: USDC_ACCOUNT, mint: USDC_MINT, amount: "1500000", decimals: 6 },
    ];

    const { json, exitCode, stderr } = await solana("balances");

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(json.balances).toEqual([
      { asset: "solana", amount: "5 SOL" },
      { asset: `solana/spl/${USDC_MINT.toLowerCase()}`, amount: "1.5 USDC" },
    ]);
  });

  it("shows each on-chain stake account in earn positions, with its validator when delegated", async () => {
    rpc.stakeAccounts = [
      { address: ACTIVE_STAKE, lamports: 3_000_000_000, validator: VALIDATOR },
      { address: IDLE_STAKE, lamports: 1_000_000_000 },
    ];

    const { json, exitCode, stderr } = await solana("earn", "positions");

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(json.stakes).toEqual([
      {
        stakeAccount: ACTIVE_STAKE,
        validator: VALIDATOR,
        state: "active",
        stakeBalance: "3000000000",
        withdrawable: "0",
      },
      {
        stakeAccount: IDLE_STAKE,
        state: "inactive",
        stakeBalance: "1000000000",
        withdrawable: "1000000000",
      },
    ]);
  });

  it("prepares a dry-run send with the network fee", async () => {
    const { json, exitCode, stderr } = await solana(
      "send",
      "--to",
      ACTIVE_STAKE,
      "--amount",
      "0.01 SOL",
      "--dry-run",
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(json).toMatchObject({
      dry_run: true,
      recipient: ACTIVE_STAKE,
      amount: "0.01 SOL",
      fee: "0.000005 SOL",
    });
  });

  it("prepares a dry-run USDC send from the token account", async () => {
    rpc.tokenAccounts = [
      { address: USDC_ACCOUNT, mint: USDC_MINT, amount: "1500000", decimals: 6 },
    ];

    const { json, exitCode, stderr } = await solana(
      "send",
      "--to",
      ACTIVE_STAKE,
      "--amount",
      "1 USDC",
      "--dry-run",
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(json).toMatchObject({ amount: "1\u00a0USDC", fee: "0.000005\u00a0SOL" });
  });

  it("refuses a send above the balance without staking limits", async () => {
    rpc.balance = 50_929_500;

    const { json, exitCode } = await solana(
      "send",
      "--to",
      ACTIVE_STAKE,
      "--amount",
      "1 SOL",
      "--dry-run",
    );

    expect(exitCode).toBe(1);
    expect(json.error).toMatchObject({ code: "NotEnoughBalance", message: "NotEnoughBalance" });
    expect(rpc.calls).not.toContain("getStakeMinimumDelegation");
  });

  describe("with the Solana app open on Speculos", () => {
    const app = solanaApp(SOL_PUBLIC_KEY, SIGNATURE);
    const speculos = new FakeSpeculos(app);
    let onDevice: ReturnType<typeof runOn>;

    beforeAll(() => {
      speculos.start();
      onDevice = runOn(server, "solana-1", SOL_DESCRIPTOR, speculos.env);
    });
    afterAll(() => speculos.stop());
    afterEach(async () => {
      app.signed = 0;
      speculos.reset();
      await disposeWalletCliDmkTransportFully();
    });

    it("signs a send on the device and broadcasts it", async () => {
      rpc.broadcastSignature = SIGNATURE_BASE58;

      const { json, exitCode, stderr } = await onDevice(
        "send",
        "--to",
        ACTIVE_STAKE,
        "--amount",
        "0.01 SOL",
      );

      expect(exitCode, `stderr: ${stderr}`).toBe(0);
      expect(json).toMatchObject({
        status: "success",
        recipient: ACTIVE_STAKE,
        amount: "0.01\u00a0SOL",
        fee: "0.000005\u00a0SOL",
        tx_hash: SIGNATURE_BASE58,
      });
      expect(app.signed).toBe(1);
      expect(rpc.broadcasts).toHaveLength(1);
    });

    it("confirms the receive address on the device", async () => {
      const { json, exitCode, stderr } = await onDevice("receive", "--verify");

      expect(exitCode, `stderr: ${stderr}`).toBe(0);
      expect(json).toMatchObject({ address: SOL_ADDRESS, verified: true, source: "device" });
      expect(speculos.apdus.filter(apdu => apdu.startsWith("e00501"))).toHaveLength(1);
    });
  });

  describe("earn deposit --dry-run below what the account can stake", () => {
    const deposit = (amount: string) =>
      solana("earn", "deposit", "--product", VALIDATOR, "--amount", amount, "--dry-run");

    beforeEach(() => {
      rpc.balance = 50_929_500;
    });

    it("explains the minimum delegation with the account's stake limits", async () => {
      const { json, exitCode } = await deposit("0.01 SOL");

      expect(exitCode).toBe(1);
      expect(json.error.code).toBe("SolanaStakeAccountAmountTooLow");
      expect(withPlainSpaces(json.error.message)).toBe(
        "Solana requires at least 1 SOL per stake account (network minimum delegation). " +
          "Requested 0.01 SOL. Max stakeable is 0.04634874 SOL: spendable balance 0.04864662 SOL " +
          "minus stake account rent 0.00228288 SOL and fee reserve 0.000015 SOL. " +
          "This account cannot stake until it receives about 0.95365126 SOL more.",
      );
    });

    it("explains a balance shortfall with the account's stake limits", async () => {
      rpc.balance = 5_000_000_000;

      const { json, exitCode } = await deposit("10 SOL");

      expect(exitCode).toBe(1);
      expect(json.error.code).toBe("NotEnoughBalance");
      expect(withPlainSpaces(json.error.message)).toBe(
        "Max stakeable is 4.99541924 SOL: spendable balance 4.99771712 SOL minus stake account " +
          "rent 0.00228288 SOL and fee reserve 0.000015 SOL. Requested 10 SOL.",
      );
    });
  });
});

describe("an Ethereum account's history, synced through the bridge (CLI)", () => {
  const CONTRACT = "0x1111111111111111111111111111111111111111";
  const block = (day: number) => ({
    hash: `0x${(1000 + day).toString(16).padStart(64, "0")}`,
    height: 20_000_000 + day,
    time: `2024-06-0${day}T12:00:00.000Z`,
  });
  const tx = (day: number, fields: Record<string, unknown>) => ({
    hash: `0x${day.toString(16).padStart(64, "0")}`,
    transaction_type: 2,
    nonce: `0x${day}`,
    nonce_value: day,
    value: "0",
    gas: "60000",
    gas_price: "20000000000",
    max_fee_per_gas: "30000000000",
    max_priority_fee_per_gas: "1000000000",
    from: ETH_ADDRESS,
    to: CONTRACT,
    transfer_events: [],
    erc721_transfer_events: [],
    erc1155_transfer_events: [],
    approval_events: [],
    actions: [],
    confirmations: 500,
    input: null,
    gas_used: "50000",
    cumulative_gas_used: "50000",
    status: 1,
    received_at: block(day).time,
    block: block(day),
    ...fields,
  });
  const history = [
    tx(2, {
      to: USDT_CONTRACT,
      transfer_events: [
        { contract: USDT_CONTRACT, from: ETH_ADDRESS, to: CONTRACT, count: "1500000" },
      ],
    }),
    tx(1, {
      actions: [
        {
          from: CONTRACT,
          to: ETH_ADDRESS,
          value: "5000000000000000",
          input: null,
          gas: "0",
          gas_used: "0",
          error: null,
        },
      ],
    }),
  ];
  const server = new MockServer([
    { method: "GET", match: /\/block\/current$/, response: block(9) },
    { method: "GET", match: /\/address\/[^/]+\/balance$/, response: { balance: "0" } },
    { method: "GET", match: /\/address\/[^/]+\/txs/, response: { data: history, token: null } },
    { method: "POST", match: /erc20\/balances/, response: [{ balance: "0" }] },
    {
      method: "GET",
      match: /\/v1\/networks/,
      response: [{ id: "ethereum", token_list_hash: "mock-sync-hash" }],
    },
    {
      method: "GET",
      match: /\/v1\/currencies/,
      response: [{ id: "ethereum" }],
      headers: { "X-Ledger-Commit": "mock-sync-hash" },
    },
    {
      method: "GET",
      match: new RegExp(`/v1/tokens.*contract_address=${USDT_CONTRACT}`, "i"),
      response: USDT_API_RESPONSE,
    },
    { method: "GET", match: /\/v1\/tokens/, response: [] },
  ]);
  const ethereum = runOn(server, "ethereum-1", ETH_DESCRIPTOR);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("lists token transfers in the token's unit and internal transfers under their parent, newest first", async () => {
    const { json, exitCode, stderr } = await ethereum("operations");

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(
      json.operations.map((op: Record<string, unknown>) => [
        op.asset,
        op.type,
        op.value,
        op.parentId,
      ]),
    ).toEqual([
      ["ethereum", "FEES", "0.001\u00a0ETH", undefined],
      ["ethereum/erc20/usd_tether__erc20_", "OUT", "1.5\u00a0USDT", undefined],
      ["ethereum", "FEES", "0.001\u00a0ETH", undefined],
      ["ethereum", "IN", "0.005\u00a0ETH", `js:2:ethereum:${ETH_ADDRESS}:-${history[1].hash}-FEES`],
    ]);
  });
});
