import { describe, it, expect, afterEach } from "bun:test";
import { MockServer } from "../../helpers/mock-server";
import { runCli } from "../../helpers/cli-runner";
import { makeSessionDir } from "../../helpers/session-fixture";
import { MOCK_ETH_DESCRIPTOR, MOCK_ETH_ADDRESS } from "../../helpers/constants";

// `earn positions` needs no device for ethereum (no Solana stake-account enrichment), so no DMK
// mock is installed.

// ---------------------------------------------------------------------------
// Integration: ethereum v3/stakes wrapper + stale marker
// ---------------------------------------------------------------------------

describe("earn positions (ethereum): v3 wrapper + stale marker", () => {
  let server: MockServer | undefined;
  let cleanup: (() => void) | undefined;
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    server?.stop();
    server = undefined;
  });

  it("renders backend rows with the (stale) marker when meta.is_stale is true", async () => {
    server = new MockServer([
      {
        method: "POST",
        match: "/v3/stakes",
        response: {
          data: [{ provider: "kiln" }],
          meta: {
            is_stale: true,
            stale_at: "2026-01-01T00:00:00.000Z",
            responded_at: "2026-01-01T00:00:01.000Z",
          },
        },
      },
    ]);
    server.start();

    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode, stderr } = await runCli(
      ["earn", "positions", "--account", "ethereum-1"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode, `stderr: ${stderr}`).toBe(0);
    expect(stdout).toContain(MOCK_ETH_ADDRESS);
    expect(stdout).toContain("(stale)");
  });

  it("json: returns a stale position row for the resolved account", async () => {
    server = new MockServer([
      {
        method: "POST",
        match: "/v3/stakes",
        response: {
          data: [{ provider: "kiln" }],
          meta: { is_stale: true, responded_at: "2026-01-01T00:00:01.000Z" },
        },
      },
    ]);
    server.start();

    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      ["earn", "positions", "--account", "ethereum-1", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.status).toBe("success");
    expect(data.command).toBe("earn positions");
    expect(data.network).toBe("ethereum:main");
    expect(data.account).toBe(MOCK_ETH_ADDRESS);
    expect(Array.isArray(data.positions)).toBe(true);
    expect(data.positions).toHaveLength(1);
    expect(data.positions[0].isStale).toBe(true);
  });

  it("defaults `data` to [] (no rows) when the backend omits it", async () => {
    server = new MockServer([
      {
        method: "POST",
        match: "/v3/stakes",
        response: { meta: { is_stale: false, responded_at: "2026-01-01T00:00:01.000Z" } },
      },
    ]);
    server.start();

    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    cleanup = fixture.cleanup;

    const { stdout, exitCode } = await runCli(
      ["earn", "positions", "--account", "ethereum-1", "--output", "json"],
      { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
    );

    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.positions).toEqual([]);
  });
});
