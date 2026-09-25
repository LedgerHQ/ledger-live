import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { MockServer, type Route } from "../../helpers/mock-server";
import { runCli } from "../../helpers/cli-runner";

const SWAP_ID = "swap-123";
const PROVIDER = "exodus";

type StatusRequest = { provider: string; swapId: string };

function answerLikeSwapApi(statusByProviderAndSwapId: Record<string, string>) {
  return (requests: StatusRequest[]) =>
    requests.map(req => ({
      ...req,
      status: statusByProviderAndSwapId[`${req.provider}:${req.swapId}`] ?? "unknown",
    }));
}

const SHARED_HASH = "0xshared";
const OFF_CONTRACT_SWAP_ID = "swap-off-contract";

const answerForKnownSwaps = answerLikeSwapApi({
  [`${PROVIDER}:${SWAP_ID}`]: "pending",
  [`oneinch:${SHARED_HASH}`]: "finished",
  [`uniswap:${SHARED_HASH}`]: "pending",
  [`lifi:${SHARED_HASH}`]: "some-unmapped-status",
  [`${PROVIDER}:${OFF_CONTRACT_SWAP_ID}`]: "some-unmapped-status",
});

function statusRoute(answer: (requests: StatusRequest[]) => unknown = answerForKnownSwaps): Route {
  return {
    method: "POST",
    match: /\/swap\/status/,
    respond: body => answer(body as StatusRequest[]),
  };
}

function runStatus(server: MockServer, swapId: string, provider: string) {
  return runCli(
    ["swap", "status", "--swap-id", swapId, "--provider", provider, "--output", "json"],
    {
      WALLET_CLI_MOCK_PORT: String(server.port),
    },
  );
}

describe("swap status", () => {
  const server = new MockServer([statusRoute()]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("human: success and shows normalized status", async () => {
    const { stdout, stderr, exitCode } = await runCli(
      ["swap", "status", "--swap-id", SWAP_ID, "--provider", PROVIDER],
      {
        WALLET_CLI_MOCK_PORT: String(server.port),
      },
    );
    expect(exitCode, stderr).toBe(0);
    expect(stdout).toContain("PENDING");
    expect(stdout).toContain(SWAP_ID);
  });

  it("json: success and core fields", async () => {
    const { stdout, stderr, exitCode } = await runStatus(server, SWAP_ID, PROVIDER);
    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    const data = JSON.parse(stdout);
    expect(data.command).toBe("swap status");
    expect(data.network).toBe("swap");
    expect(data.swapId).toBe(SWAP_ID);
    expect(data.status).toBe("PENDING");
  });

  it("exits with code 1 when --provider is not on the allow-list", async () => {
    const { exitCode } = await runCli([
      "swap",
      "status",
      "--swap-id",
      SWAP_ID,
      "--provider",
      "unknown_provider",
    ]);
    expect(exitCode).toBe(1);
  });

  it("fails and names the right provider when --provider does not own the swap id", async () => {
    const { stdout, exitCode } = await runStatus(server, SWAP_ID, "nearintents");
    expect(exitCode).toBe(1);

    const data = JSON.parse(stdout);
    expect(data.ok).toBe(false);
    expect(data.error.message).toContain(`was not found for provider "nearintents"`);
    expect(data.error.message).toContain(`re-run with --provider ${PROVIDER}`);
  });

  it("fails without a suggestion when no provider knows the swap id", async () => {
    const { stdout, exitCode } = await runStatus(server, "missing-swap", PROVIDER);
    expect(exitCode).toBe(1);

    const { error } = JSON.parse(stdout);
    expect(error.message).toContain(`Swap "missing-swap" was not found for provider "${PROVIDER}"`);
    expect(error.message).not.toContain("re-run with");
  });

  it("fails when --provider answers with a status outside the swap API contract", async () => {
    const { stdout, exitCode } = await runStatus(server, OFF_CONTRACT_SWAP_ID, PROVIDER);
    expect(exitCode).toBe(1);

    const { error } = JSON.parse(stdout);
    expect(error.message).toContain(`was not found for provider "${PROVIDER}"`);
  });

  it("lists every provider with a known status without picking one", async () => {
    const { stdout, exitCode } = await runStatus(server, SHARED_HASH, "velora");
    expect(exitCode).toBe(1);

    const { error } = JSON.parse(stdout);
    expect(error.message).toContain(`"oneinch"`);
    expect(error.message).toContain(`"uniswap"`);
    expect(error.message).not.toContain(`"lifi"`);
    expect(error.message).not.toContain("--provider oneinch");
  });
});

describe("swap status when the provider lookup fails", () => {
  const server = new MockServer([
    statusRoute(requests => {
      const isProviderLookup = requests.length > 1;
      return isProviderLookup
        ? new Response("lookup unavailable", { status: 500 })
        : answerForKnownSwaps(requests);
    }),
  ]);

  beforeAll(() => server.start());
  afterAll(() => server.stop());

  it("still reports the provider mismatch", async () => {
    const { stdout, exitCode } = await runStatus(server, SWAP_ID, "nearintents");
    expect(exitCode).toBe(1);

    const { error } = JSON.parse(stdout);
    expect(error.message).toContain(`was not found for provider "nearintents"`);
    expect(error.message).not.toContain("re-run with");
  });
});
