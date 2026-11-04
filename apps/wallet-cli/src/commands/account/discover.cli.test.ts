import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { join } from "node:path";
import { YAML } from "bun";
import { MockServer } from "../../testing/mock-server";
import { runCli } from "../../testing/cli-runner";
import { makeSessionDir } from "../../testing/session-fixture";
import { ETH_SYNC_ROUTES } from "../../testing/eth-sync-routes";
import { MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "../../testing/constants";
import {
  recordLedgerVendorSeen,
  recordScanCompleted,
  resetUsbAccessDiagnostics,
} from "../../device/usb-access-diagnostics";

const MOCK_ENV = (port: number) => ({
  WALLET_CLI_MOCK_PORT: String(port),
  WALLET_CLI_MOCK_DMK: "1",
  WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
    Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
  }),
});

describe("account discover command (mock DMK)", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("json output: exits 0 and returns a discover envelope", async () => {
    const fixture = makeSessionDir([]);
    const { stdout, exitCode, stderr } = await runCli(
      ["account", "discover", "--network", "ethereum", "--output", "json"],
      { ...MOCK_ENV(server.port), ...fixture.env },
    ).finally(fixture.cleanup);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("account discover");
    expect(data.network).toBe("ethereum");
    expect(Array.isArray(data.accounts)).toBe(true);
    expect(data.accounts.length).toBeGreaterThan(0);
    for (const account of data.accounts) {
      expect(typeof account.label).toBe("string");
      expect(account.label.length).toBeGreaterThan(0);
      expect(typeof account.freshAddress).toBe("string");
      expect("descriptor" in account).toBe(false);
    }
  });
});

describe("account discover — session persistence", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);
  let cleanup: (() => void) | undefined;

  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
  });

  it("writes discovered accounts to session.yaml with generated labels", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;

    const { exitCode, stderr } = await runCli(
      ["account", "discover", "--network", "ethereum", "--output", "json"],
      { ...MOCK_ENV(server.port), ...fixture.env },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const sessionPath = join(fixture.env.XDG_STATE_HOME, "ledger-wallet-cli", "session.yaml");
    const session = YAML.parse(await Bun.file(sessionPath).text()) as {
      accounts: Array<{ label: string; descriptor: string }>;
    };
    expect(Array.isArray(session.accounts)).toBe(true);
    expect(session.accounts.length).toBeGreaterThan(0);
    expect(session.accounts[0].label).toMatch(/^ethereum-\d+$/);
    expect(session.accounts[0].descriptor).toContain(":ethereum:");
  });

  it("does not duplicate accounts on repeated discover", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;

    const args = ["account", "discover", "--network", "ethereum", "--output", "json"];
    const env = { ...MOCK_ENV(server.port), ...fixture.env };

    await runCli(args, env);
    const { exitCode, stderr } = await runCli(args, env);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const sessionPath = join(fixture.env.XDG_STATE_HOME, "ledger-wallet-cli", "session.yaml");
    const session = YAML.parse(await Bun.file(sessionPath).text()) as { accounts: unknown[] };
    expect(session.accounts.length).toBe(1); // no duplicate
  });
});

describe("account discover — device timeout mid-scan (LIVE-31394)", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => resetUsbAccessDiagnostics());

  it("does not ask to open the app it already opened when the scan times out", async () => {
    const fixture = makeSessionDir([]);
    resetUsbAccessDiagnostics();
    recordScanCompleted();
    recordLedgerVendorSeen();

    const { stdout, exitCode } = await runCli(
      ["account", "discover", "--network", "ethereum", "--output", "json"],
      {
        ...MOCK_ENV(server.port),
        ...fixture.env,
        WALLET_CLI_MOCK_DMK_APP_TASKS_BEFORE_TIMEOUT: "1",
      },
    ).finally(fixture.cleanup);

    expect(exitCode).toBe(6);
    expect(JSON.parse(stdout.trim().split("\n").at(-1) ?? "")).toMatchObject({
      ok: false,
      error: {
        code: "timeout",
        message:
          "Timed out talking to the Ledger over USB. The device may be busy or locked. Retry the command.",
        likely_cause: "unknown",
      },
    });
  });
});
