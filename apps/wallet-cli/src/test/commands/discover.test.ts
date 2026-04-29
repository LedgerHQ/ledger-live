import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { join } from "node:path";
import { YAML } from "bun";
import { MockServer } from "../helpers/mock-server";
import { runCli } from "../helpers/cli-runner";
import { makeSessionDir } from "../helpers/session-fixture";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import { MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "../helpers/constants";

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
    const { stdout, exitCode, stderr } = await runCli(
      ["account", "discover", "--network", "ethereum", "--output", "json"],
      MOCK_ENV(server.port),
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("account discover");
    expect(data.network).toBe("ethereum:main");
    expect(Array.isArray(data.accounts)).toBe(true);
  });
});

describe("account discover — session persistence", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);
  let cleanup: (() => void) | undefined;

  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => { cleanup?.(); cleanup = undefined; });

  it("writes discovered accounts to session.yaml with generated labels", async () => {
    const fixture = makeSessionDir([]);
    cleanup = fixture.cleanup;

    const { exitCode, stderr } = await runCli(
      ["account", "discover", "--network", "ethereum", "--output", "json"],
      { ...MOCK_ENV(server.port), ...fixture.env },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const sessionPath = join(fixture.env.XDG_STATE_HOME, "ledger-wallet-cli", "session.yaml");
    const session = YAML.parse(await Bun.file(sessionPath).text()) as { accounts: Array<{ label: string; descriptor: string }> };
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
