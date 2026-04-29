import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { ETH_SYNC_ROUTES } from "../helpers/eth-sync-routes";
import { runCli } from "../helpers/cli-runner";
import { MockServer } from "../helpers/mock-server";
import { MOCK_ETH_DESCRIPTOR } from "../helpers/constants";

/**
 * Replace the full swap pipeline (device + swap API + broadcast) so we only exercise
 * `swap execute` wiring: descriptors → sync → JSON envelope.
 * Must be registered before `runCli` loads the CLI (lazy import).
 */
const pipelineUrl = new URL("../../commands/swap/cli-swap-pipeline.ts", import.meta.url).href;

const mockPipelineResult = {
  transactionId: "mock-device-transaction-id",
  payload: {
    binaryPayload: "00",
    signature: "mock-signature",
    payinAddress: "0x0000000000000000000000000000000000000001",
    swapId: "mock-swap-id",
  },
  operationHash: "0xmockoperationhash",
  swapId: "mock-swap-id",
  amountExpectedTo: "1000000000000000000",
  magnitudeAwareRate: "2500.5",
} as const;

mock.module(pipelineUrl, () => ({
  runFullSwapPipeline: mock(() => Promise.resolve({ ...mockPipelineResult })),
}));

const baseExecuteArgs = [
  "execute",
  "--provider",
  "changelly",
  "--amount",
  "0.001",
  "--account",
  MOCK_ETH_DESCRIPTOR,
  "--to-account",
  MOCK_ETH_DESCRIPTOR,
  "--output",
  "json",
] as const;

describe("swap execute command", () => {
  const server = new MockServer(ETH_SYNC_ROUTES);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("json: exits 1 with a clear error when --to-account is missing", async () => {
    const { stdout, exitCode, stderr } = await runCli(
      [
        "execute",
        "--provider",
        "changelly",
        "--amount",
        "0.001",
        "--account",
        MOCK_ETH_DESCRIPTOR,
        "--output",
        "json",
      ],
      { WALLET_CLI_MOCK_PORT: String(server.port) },
    );
    expect(exitCode, `stderr: ${stderr}`).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain("--to-account");
  });

  it("json: full pipeline wiring returns swap execute envelope (mocked pipeline)", async () => {
    const { stdout, exitCode, stderr } = await runCli([...baseExecuteArgs], {
      WALLET_CLI_MOCK_PORT: String(server.port),
    });
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("swap execute");
    expect(data.network).toBe("ethereum:main");
    expect(data.provider).toBe("changelly");
    expect(data.amount).toBe("0.001");
    expect(data.transactionId).toBe(mockPipelineResult.transactionId);
    expect(data.payload.swapId).toBe("mock-swap-id");
    expect(data.operationHash).toBe(mockPipelineResult.operationHash);
    expect(data.swapId).toBe("mock-swap-id");
    expect(data.amountExpectedTo).toBe(mockPipelineResult.amountExpectedTo);
    expect(data.magnitudeAwareRate).toBe(mockPipelineResult.magnitudeAwareRate);
  });
});
