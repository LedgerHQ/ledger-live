import { describe, it, expect, afterEach, beforeEach } from "bun:test";
import { resetTestSeams } from "../../shared/test-seam";
import { useFreshCalCache } from "../../testing/cal-cache";
import { MockServer } from "../../testing/mock-server";
import {
  MOCK_ETH_DESCRIPTOR,
  MOCK_ETH_ADDRESS,
  MOCK_ETH_PUBKEY,
  MOCK_SOL_DESCRIPTOR,
  MOCK_SOL_ADDRESS,
  MOCK_BTC_DESCRIPTOR,
} from "../../testing/constants";
import {
  calls,
  earnResults,
  FakeEarnApi,
  FakeEvmNode,
  jsonLines,
  runEarn,
  references,
  SignedEvmEarn,
  SignedSolanaEarn,
  SOLANA_ACCOUNT,
  SOLANA_STAKE,
  VAULT,
} from "../../testing/earn-vault";

const ETH_ACCOUNT = { label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR };
const SOL_ACCOUNT = { label: "solana-1", descriptor: MOCK_SOL_DESCRIPTOR };
const WITHDRAW = ["withdraw", "--account", "ethereum-1", "--product", VAULT.id];

// Dry runs never sign, so the stock mock device is enough.
const DMK_ENV = {
  WALLET_CLI_MOCK_DMK: "1",
  WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
    Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
  }),
};

let stopServer: (() => void) | undefined;

afterEach(() => {
  resetTestSeams();
  stopServer?.();
  stopServer = undefined;
});

function serve(routes: ConstructorParameters<typeof MockServer>[0] = []): Record<string, string> {
  const server = new MockServer(routes);
  server.start();
  stopServer = () => server.stop();
  return { WALLET_CLI_MOCK_PORT: String(server.port) };
}

function signedEvm(hashes: string[]): { earn: SignedEvmEarn; env: Record<string, string> } {
  const earn = new SignedEvmEarn(hashes);
  const env = earn.start();
  stopServer = () => earn.stop();
  return { earn, env };
}

describe("earn withdraw --dry-run (EVM full exit)", () => {
  it("json output: asks the backend for the max and labels the amount as the full balance", async () => {
    const api = new FakeEarnApi();
    const env = serve([...new FakeEvmNode([]).routes, ...api.routes]);

    const { stdout, exitCode, stderr } = await runEarn(ETH_ACCOUNT, [...WITHDRAW, "--dry-run"], {
      ...env,
      ...DMK_ENV,
    });

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    // The prepare step emits no envelope of its own.
    const lines = jsonLines(stdout);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      command: "earn withdraw",
      network: "ethereum",
      family: "evm",
      dryRun: true,
      product: VAULT.id,
      status: "dry-run",
      amount: "max (full balance)",
    });
    expect(lines[0].transactions).toEqual([{ kind: "redeem", status: "dry-run", to: VAULT.vault }]);
    // "max" lets the backend redeem the whole share balance, leaving no dust.
    expect(api.posts).toEqual([
      { path: "/v1/defi/withdraw", body: expect.objectContaining({ amount: "max" }) },
    ]);
  });
});

describe("earn withdraw (EVM, signed on the device)", () => {
  it("redeems a partial amount in asset base units and reports the confirmed redeem", async () => {
    const { earn, env } = signedEvm(["0xredeem"]);

    const { stdout, exitCode, stderr } = await runEarn(
      ETH_ACCOUNT,
      [...WITHDRAW, "--amount", "50 USDC"],
      env,
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    const results = earnResults(stdout);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ status: "success", amount: "50 USDC", dryRun: false });
    expect(results[0].transactions).toEqual([
      { kind: "redeem", hash: "0xredeem", to: VAULT.vault, status: "success" },
    ]);
    expect(earn.api.posts).toEqual([
      { path: "/v1/defi/withdraw", body: expect.objectContaining({ amount: "50000000" }) },
    ]);
    expect(earn.node.broadcasts).toHaveLength(1);
    expect(calls(earn.node.broadcasts[0], VAULT.vault)).toBe(true);
    expect(earn.device.openedApps[0]).toMatchObject({ dependencies: [{ name: "Kiln" }] });
  });

  it("fails when the redeem reverts on-chain instead of reporting success", async () => {
    const { earn, env } = signedEvm(["0xredeem"]);
    earn.api.statuses["0xredeem"] = ["error"];

    const { stdout, exitCode } = await runEarn(
      ETH_ACCOUNT,
      [...WITHDRAW, "--amount", "50 USDC"],
      env,
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain(
      "Redeem transaction 0xredeem reverted on-chain",
    );
  });

  it("rejects an amount in another ticker than the vault asset before building anything", async () => {
    const { earn, env } = signedEvm([]);

    const { stdout, exitCode } = await runEarn(
      ETH_ACCOUNT,
      [...WITHDRAW, "--amount", "50 DAI"],
      env,
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain("does not match the vault asset");
    expect(earn.api.posts).toEqual([]);
    expect(earn.device.openedApps).toEqual([]);
  });
});

describe("earn withdraw (Solana, signed on the device)", () => {
  let restoreCalCache: () => void;
  beforeEach(() => {
    restoreCalCache = useFreshCalCache();
  });
  afterEach(() => restoreCalCache());

  it("deactivates the whole stake account on the first run", async () => {
    const earn = new SignedSolanaEarn();
    const env = earn.start();
    stopServer = () => earn.stop();

    const { stdout, exitCode, stderr } = await runEarn(
      SOLANA_ACCOUNT,
      ["withdraw", "--account", "solana-1", "--stake-account", SOLANA_STAKE],
      env,
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(earnResults(stdout)).toEqual([
      expect.objectContaining({
        family: "solana",
        stakeAccount: SOLANA_STAKE,
        finalize: false,
        status: "broadcasted",
        transactions: [
          { kind: "stake.undelegate", hash: earn.node.signature, status: "broadcasted" },
        ],
      }),
    ]);
    expect(earn.node.sent).toHaveLength(1);
    expect(references(earn.node.sent[0], SOLANA_STAKE)).toBe(true);
  });
});

describe("earn withdraw: dispatch + guard errors", () => {
  it("EVM: requires --product (thrown before any pipeline/HTTP call)", async () => {
    const { stdout, exitCode } = await runEarn(
      ETH_ACCOUNT,
      ["withdraw", "--account", "ethereum-1", "--dry-run"],
      serve(),
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain("EVM withdraw requires --product");
  });

  it("Solana: requires --stake-account (no HTTP)", async () => {
    const { stdout, exitCode } = await runEarn(
      SOL_ACCOUNT,
      ["withdraw", "--account", "solana-1", "--dry-run"],
      serve(),
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain(
      "Solana withdraw requires --stake-account",
    );
  });

  // Reaches withdrawSolana (proving solana family dispatch) and throws before prepareSend.
  it("Solana: rejects a partial --amount withdraw", async () => {
    const { stdout, exitCode } = await runEarn(
      SOL_ACCOUNT,
      [
        "withdraw",
        "--account",
        "solana-1",
        "--stake-account",
        MOCK_SOL_ADDRESS,
        "--amount",
        "1 SOL",
        "--dry-run",
      ],
      serve(),
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain(
      "Partial Solana withdraw is unsupported",
    );
  });

  it("rejects an unsupported family before any HTTP call", async () => {
    const { stdout, exitCode } = await runEarn(
      { label: "bitcoin-1", descriptor: MOCK_BTC_DESCRIPTOR },
      ["withdraw", "--account", "bitcoin-1", "--dry-run"],
      serve(),
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain(
      "Unsupported family for earn withdraw: bitcoin. Supported: evm, solana.",
    );
  });
});
