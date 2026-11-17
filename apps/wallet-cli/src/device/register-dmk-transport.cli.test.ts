import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { DEVICE_EXIT_CODES } from "./device-state";
import {
  _setTestSpeculosConnectTimeoutMs,
  disposeWalletCliDmkTransportFully,
} from "./register-dmk-transport";
import { runCli } from "../testing/cli-runner";
import { ETH_SYNC_ROUTES } from "../testing/eth-sync-routes";
import { ethereumApp, FakeSpeculos, SPECULOS_CONNECT_APDU } from "../testing/fake-speculos";
import { MockServer } from "../testing/mock-server";
import { MOCK_ETH_ADDRESS } from "../testing/constants";

const speculos = new FakeSpeculos(ethereumApp(MOCK_ETH_ADDRESS));
const api = new MockServer(ETH_SYNC_ROUTES);

beforeAll(() => {
  speculos.start();
  api.start();
});
afterAll(() => {
  speculos.stop();
  api.stop();
});
beforeEach(() => speculos.reset());
afterEach(async () => {
  _setTestSpeculosConnectTimeoutMs(null);
  speculos.reset();
  await disposeWalletCliDmkTransportFully();
});

async function discover(env: Record<string, string> = speculos.env) {
  const run = await runCli(["account", "discover", "--network", "ethereum", "--output", "json"], {
    ...env,
    WALLET_CLI_MOCK_PORT: String(api.port),
  });
  return { ...run, json: JSON.parse(run.stdout) };
}

const connects = () => speculos.apdus.filter(apdu => apdu === SPECULOS_CONNECT_APDU).length;

/** A local port nothing listens on: a stopped Speculos. */
function closedPort(): string {
  const server = Bun.serve({ port: 0, fetch: () => new Response() });
  const port = String(server.port);
  server.stop(true);
  return port;
}

describe("device transport on Speculos (CLI)", () => {
  it("connects once per command and opens a new session for the next one", async () => {
    const first = await discover();
    expect(first.exitCode, `stderr: ${first.stderr}`).toBe(0);
    expect(first.json.accounts).toEqual([
      expect.objectContaining({ label: "ethereum-1", freshAddress: MOCK_ETH_ADDRESS }),
    ]);
    expect(connects()).toBe(1);

    const second = await discover();
    expect(second.exitCode, `stderr: ${second.stderr}`).toBe(0);
    expect(connects()).toBe(2);
  });

  it("names the Speculos URL and the HTTP cause when nothing listens there", async () => {
    const port = closedPort();

    const { exitCode, json } = await discover({ SPECULOS_API_PORT: port });

    expect(exitCode).toBe(DEVICE_EXIT_CODES.disconnected);
    expect(json.error).toMatchObject({ command: "account discover", code: "disconnected" });
    expect(json.error.message).toStartWith(`Speculos not reachable at http://127.0.0.1:${port} (`);
    expect(json.error.message).toContain("Unable to connect");
  });

  it("reports an emulator error on connect, then connects on the next command", async () => {
    speculos.failWith(500);

    const failed = await discover();

    expect(failed.exitCode).toBe(DEVICE_EXIT_CODES.disconnected);
    expect(failed.json.error.message).toBe(
      `Speculos not reachable at ${speculos.url} (HTTP error 500 Internal Server Error). ` +
        "Start Speculos or fix SPECULOS_API_PORT / SPECULOS_ADDRESS, then retry.",
    );

    speculos.reset();
    const retried = await discover();
    expect(retried.exitCode, `stderr: ${retried.stderr}`).toBe(0);
    expect(connects()).toBe(1);
  });

  it("times out a connect the emulator never answers", async () => {
    _setTestSpeculosConnectTimeoutMs(20);
    speculos.hang();

    const { exitCode, json } = await discover();

    expect(exitCode).toBe(DEVICE_EXIT_CODES.timeout);
    expect(json.error).toMatchObject({
      code: "timeout",
      message: `Timed out talking to Speculos at ${speculos.url}. The emulated app may be waiting for a button press. Retry the command.`,
    });
  });
});
