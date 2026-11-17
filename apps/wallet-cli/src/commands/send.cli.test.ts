import { describe, it, expect, beforeAll, afterAll, afterEach } from "bun:test";
import { MockServer } from "../testing/mock-server";
import { runCli } from "../testing/cli-runner";
import { makeSessionDir } from "../testing/session-fixture";
import { ETH_SYNC_ROUTES } from "../testing/eth-sync-routes";
import { MOCK_ETH_DESCRIPTOR, MOCK_ETH_ADDRESS, MOCK_ETH_PUBKEY } from "../testing/constants";
import { FakeEvmNode } from "../testing/earn-vault";
import { FakeLedger } from "../testing/fake-ledger";

// Routes needed by prepareTransaction (gas estimation, nonce, fee data) in addition to sync.
// The balance route is placed first (before ETH_SYNC_ROUTES) so it overrides the default
// zero-balance route — the send command requires sufficient balance to avoid NotEnoughBalance.
const SEND_ROUTES = [
  {
    method: "GET",
    match: /\/address\/[^/]+\/balance$/,
    response: { balance: "1000000000000000000" }, // 1 ETH
  },
  ...ETH_SYNC_ROUTES,
  {
    method: "GET",
    match: /\/address\/[^/]+\/nonce$/,
    response: { address: MOCK_ETH_ADDRESS, nonce: 0 },
  },
  {
    method: "POST",
    match: /\/tx\/estimate-gas-limit/,
    response: { estimated_gas_limit: "21000" },
  },
  {
    method: "GET",
    match: /\/gastracker\/barometer/,
    response: { low: "1", medium: "2", high: "3", next_base: "1" },
  },
];

describe("send (non-dry-run): device model resolution", () => {
  const server = new MockServer([]);

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("exits with a clear error when deviceModelId cannot be resolved from the DMK session", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode } = await runCli(
      [
        "send",
        "--account",
        "ethereum-1",
        "--to",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "--amount",
        "0.001 ETH",
        "--output",
        "json",
      ],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
        WALLET_CLI_MOCK_DMK: "1",
        WALLET_CLI_MOCK_DMK_STATE: "no-device-model",
        WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
          Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
        }),
        ...fixture.env,
      },
    );
    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("Could not determine device model");
  });
});

describe("send --dry-run command", () => {
  const server = new MockServer(SEND_ROUTES);

  let sessionCleanup: (() => void) | undefined;
  beforeAll(() => server.start());
  afterAll(() => server.stop());
  afterEach(() => {
    sessionCleanup?.();
    sessionCleanup = undefined;
  });

  it("json output: exits 0 and returns a dry-run send envelope for ETH", async () => {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    sessionCleanup = fixture.cleanup;
    const { stdout, exitCode, stderr } = await runCli(
      [
        "send",
        "--account",
        "ethereum-1",
        "--to",
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "--amount",
        "0.001 ETH",
        "--dry-run",
        "--output",
        "json",
      ],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
        WALLET_CLI_MOCK_DMK: "1",
        WALLET_CLI_MOCK_APP_RESULTS: JSON.stringify({
          Ethereum: { publicKey: MOCK_ETH_PUBKEY, address: MOCK_ETH_ADDRESS },
        }),
        ...fixture.env,
      },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("send");
    expect(data.network).toBe("ethereum");
    expect(data.dry_run).toBe(true);
    expect(typeof data.recipient).toBe("string");
    expect(typeof data.amount).toBe("string");
    expect(typeof data.fee).toBe("string");
  });
});

describe("send refused on the device", () => {
  const node = new FakeEvmNode([`0x${"ab".repeat(32)}`]);
  const server = new MockServer(node.routes);

  beforeAll(() => server.start());
  afterAll(() => server.stop());
  let unplug: (() => void) | undefined;
  afterEach(() => unplug?.());

  function plugIn(device: FakeLedger): void {
    unplug = device.install();
  }

  async function send() {
    const fixture = makeSessionDir([{ label: "ethereum-1", descriptor: MOCK_ETH_DESCRIPTOR }]);
    try {
      const run = await runCli(
        [
          "send",
          "--account",
          "ethereum-1",
          "--to",
          "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          "--amount",
          "0.001 ETH",
          "--output",
          "json",
        ],
        { WALLET_CLI_MOCK_PORT: String(server.port), ...fixture.env },
      );
      return { ...run, result: JSON.parse(run.stdout.split("\n").at(-1)!) };
    } finally {
      fixture.cleanup();
    }
  }

  it("stops at the app the user refused to open", async () => {
    const device = new FakeLedger();
    device.refuseToOpen = "Ethereum";
    plugIn(device);

    const { result, exitCode } = await send();

    expect(exitCode).toBe(2);
    expect(result).toEqual({
      ok: false,
      error: {
        command: "send",
        code: "rejected",
        message: "Rejected on device. App was not opened.",
      },
    });
    expect(node.broadcasts).toEqual([]);
  });

  it("broadcasts nothing when the user refuses the transaction", async () => {
    const device = new FakeLedger();
    device.refuseToSign = true;
    plugIn(device);

    const { result, exitCode } = await send();

    expect(exitCode).toBe(1);
    expect(result.error).toMatchObject({ code: "UserRefusedOnDevice" });
    expect(device.events).toEqual(["open Ethereum", "sign 44'/60'/0'/0/0", "close session"]);
    expect(node.broadcasts).toEqual([]);
  });
});
