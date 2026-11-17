import { describe, it, expect, afterEach, beforeEach } from "bun:test";
import { resetTestSeams } from "../../shared/test-seam";
import { useFreshCalCache } from "../../testing/cal-cache";
import { MockServer } from "../../testing/mock-server";
import {
  MOCK_ETH_DESCRIPTOR,
  MOCK_ETH_ADDRESS,
  MOCK_ETH_PUBKEY,
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
  SOLANA_VALIDATOR,
  VAULT,
} from "../../testing/earn-vault";

const ETH_ACCOUNT = { label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR };
const SEPOLIA_ACCOUNT = {
  label: "sepolia-1",
  descriptor: `account:2:address:ethereum_sepolia:${MOCK_ETH_ADDRESS}:m/44h/60h/0h/0/0`,
};
const DEPOSIT = [
  "deposit",
  "--account",
  "ethereum-1",
  "--product",
  VAULT.id,
  "--amount",
  "100 USDC",
];

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

describe("earn deposit --dry-run (EVM)", () => {
  it("json output: validates the approve and skips the deposit it cannot simulate yet", async () => {
    const api = new FakeEarnApi();
    const env = serve([...new FakeEvmNode([]).routes, ...api.routes]);

    const { stdout, exitCode, stderr } = await runEarn(ETH_ACCOUNT, [...DEPOSIT, "--dry-run"], {
      ...env,
      ...DMK_ENV,
    });

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    // The prepare step emits no envelope of its own.
    const lines = jsonLines(stdout);
    expect(lines).toHaveLength(1);
    const [data] = lines;
    expect(data).toMatchObject({
      command: "earn deposit",
      network: "ethereum",
      family: "evm",
      dryRun: true,
      product: VAULT.id,
    });
    expect(data.status).toContain("approve validated");
    expect(data.transactions?.map(t => t.kind)).toEqual(["approve", "deposit"]);
    expect(data.transactions?.[0].status).toBe("dry-run");
    expect(data.transactions?.[1].status).toContain("not-simulated");
    // /v1/defi/deposit fails while the allowance is 0, so it is never asked.
    expect(api.posts.map(p => p.path)).toEqual(["/v1/defi/approve"]);
    expect(api.posts[0].body).toMatchObject({ amount: "100000000", vault: VAULT.vault });
  });

  it("human output: renders the deposit, status and approve/deposit lines", async () => {
    const env = serve([...new FakeEvmNode([]).routes, ...new FakeEarnApi().routes]);

    const { stdout, exitCode, stderr } = await runEarn(
      ETH_ACCOUNT,
      [...DEPOSIT, "--dry-run"],
      { ...env, ...DMK_ENV },
      "human",
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain("Deposit:");
    expect(stdout).toContain("Status:");
    expect(stdout).toContain("approve");
    expect(stdout).toContain("deposit");
  });
});

describe("earn deposit (EVM, signed on the device)", () => {
  it("broadcasts the approve, waits for it through pending polls, then deposits", async () => {
    const { earn, env } = signedEvm(["0xapprove", "0xdeposit"]);
    // A 5xx and a refused connection both read as "not mined yet".
    earn.api.statuses["0xapprove"] = ["pending_confirmation", 500, "refused", "success"];

    const { stdout, exitCode, stderr } = await runEarn(
      ETH_ACCOUNT,
      [...DEPOSIT, "--device-timeout", "1234"],
      env,
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    // Signing streams progress only: the deposit result is the one terminal envelope.
    const results = earnResults(stdout);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ status: "success", dryRun: false, amount: "100 USDC" });
    expect(results[0].transactions).toEqual([
      { kind: "approve", hash: "0xapprove", to: VAULT.asset, status: "success" },
      { kind: "deposit", hash: "0xdeposit", to: VAULT.vault, status: "success" },
    ]);

    const { api, node, device, sleeps } = earn;
    expect(node.broadcasts).toHaveLength(2);
    expect(calls(node.broadcasts[0], VAULT.asset)).toBe(true);
    expect(calls(node.broadcasts[1], VAULT.vault)).toBe(true);
    expect(api.posts.map(p => p.path)).toEqual(["/v1/defi/approve", "/v1/defi/deposit"]);
    expect(api.polls).toEqual(["0xapprove", "0xapprove", "0xapprove", "0xapprove", "0xdeposit"]);
    expect(sleeps).toEqual([5000, 5000, 5000]);

    // The Ethereum app opens with Kiln, which clear-signs the vault calldata.
    expect(device.signed).toBe(2);
    expect(device.openedApps.length).toBeGreaterThan(0);
    for (const app of device.openedApps) {
      expect(app).toMatchObject({
        application: { name: "Ethereum" },
        dependencies: [{ name: "Kiln" }],
        unlockTimeout: 1234,
      });
    }
  });

  it("deposits alone when the allowance suffices, and fails fast on a 4xx status", async () => {
    const { earn, env } = signedEvm(["0xdeposit"]);
    earn.api.approve = null;
    earn.api.statuses["0xdeposit"] = [400, "success"];

    const { stdout, exitCode } = await runEarn(ETH_ACCOUNT, DEPOSIT, env);

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain("failed: 400 (tx_hash=0xdeposit)");
    expect(earn.node.broadcasts).toHaveLength(1);
    expect(calls(earn.node.broadcasts[0], VAULT.vault)).toBe(true);
    expect(earn.api.polls).toEqual(["0xdeposit"]);
  });

  it("stops before the deposit when the approve is still pending after every poll", async () => {
    const { earn, env } = signedEvm(["0xapprove"]);
    earn.api.statuses["0xapprove"] = ["pending_confirmation"];

    const { stdout, exitCode } = await runEarn(ETH_ACCOUNT, DEPOSIT, env);

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain(
      "did not reach success after 150s (last status: pending_confirmation)",
    );
    expect(earn.api.polls).toHaveLength(30);
    expect(earn.sleeps).toHaveLength(29);
    expect(earn.node.broadcasts).toHaveLength(1);
    expect(earn.api.posts.map(p => p.path)).toEqual(["/v1/defi/approve"]);
  });

  it("broadcasts nothing when the user refuses on the device", async () => {
    const { earn, env } = signedEvm(["0xdeposit"]);
    earn.api.approve = null;
    earn.device.refuse = true;

    const { stdout, exitCode } = await runEarn(ETH_ACCOUNT, DEPOSIT, env);

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.code).toBe("UserRefusedOnDevice");
    expect(earn.device.signed).toBe(1);
    expect(earn.node.broadcasts).toEqual([]);
    expect(earn.api.polls).toEqual([]);
  });

  it("refuses an account on another chain than the vault before building anything", async () => {
    const { earn, env } = signedEvm([]);

    const { stdout, exitCode } = await runEarn(
      SEPOLIA_ACCOUNT,
      ["deposit", "--account", "sepolia-1", "--product", VAULT.id, "--amount", "100 USDC"],
      env,
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain(
      "is on chain id 11155111 but vault usdc-vault is on chain id 1",
    );
    expect(earn.api.posts).toEqual([]);
    expect(earn.device.openedApps).toEqual([]);
  });
});

describe("earn deposit (Solana, signed on the device)", () => {
  const SOL_DEPOSIT = [
    "deposit",
    "--account",
    "solana-1",
    "--product",
    SOLANA_VALIDATOR,
    "--amount",
    "1.5 SOL",
  ];

  let restoreCalCache: () => void;
  beforeEach(() => {
    restoreCalCache = useFreshCalCache();
  });
  afterEach(() => restoreCalCache());

  function signedSolana(): { earn: SignedSolanaEarn; env: Record<string, string> } {
    const earn = new SignedSolanaEarn();
    const env = earn.start();
    stopServer = () => earn.stop();
    return { earn, env };
  }

  it("creates and delegates a stake account to the --product validator", async () => {
    const { earn, env } = signedSolana();

    const { stdout, exitCode, stderr } = await runEarn(SOLANA_ACCOUNT, SOL_DEPOSIT, env);

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(earnResults(stdout)).toEqual([
      expect.objectContaining({
        family: "solana",
        validator: SOLANA_VALIDATOR,
        status: "broadcasted",
        transactions: [
          { kind: "stake.createAccount", hash: earn.node.signature, status: "broadcasted" },
        ],
      }),
    ]);
    expect(earn.device.openedApps[0]).toMatchObject({ application: { name: "Solana" } });
    expect(earn.device.signed).toBe(1);
    expect(earn.node.sent).toHaveLength(1);
    expect(references(earn.node.sent[0], SOLANA_VALIDATOR)).toBe(true);
  });

  it("broadcasts nothing when the user refuses on the device", async () => {
    const { earn, env } = signedSolana();
    earn.device.refuse = true;

    const { stdout, exitCode } = await runEarn(SOLANA_ACCOUNT, SOL_DEPOSIT, env);

    expect(exitCode).toBe(2);
    expect(earnResults(stdout)[0].error).toMatchObject({
      code: "rejected",
      message: "Rejected on device. No action taken.",
    });
    expect(earn.device.signed).toBe(1);
    expect(earn.node.sent).toEqual([]);
  });
});

describe("earn deposit: dispatch + guard errors", () => {
  it("rejects an unsupported family before any HTTP call", async () => {
    const { stdout, exitCode } = await runEarn(
      { label: "bitcoin-1", descriptor: MOCK_BTC_DESCRIPTOR },
      ["deposit", "--account", "bitcoin-1", "--product", "x", "--amount", "1 BTC", "--dry-run"],
      serve(),
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain(
      "Unsupported family for earn deposit: bitcoin. Supported: evm, solana.",
    );
  });

  it("fails with a clear error for an unknown --account label", async () => {
    const { stdout, exitCode } = await runEarn(
      ETH_ACCOUNT,
      ["deposit", "--account", "nope", "--product", VAULT.id, "--amount", "100 USDC", "--dry-run"],
      serve(),
    );

    expect(exitCode).toBe(1);
    expect(earnResults(stdout)[0].error?.message).toContain('No account labeled "nope"');
  });

  // Bunli reports missing required flags on its own stderr channel, outside the captured output.
  it("exits non-zero when required flags are missing", async () => {
    const { exitCode } = await runEarn(
      ETH_ACCOUNT,
      ["deposit", "--account", "ethereum-1", "--dry-run"],
      serve(),
    );

    expect(exitCode).toBe(1);
  });
});
