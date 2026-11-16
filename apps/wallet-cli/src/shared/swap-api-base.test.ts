import { describe, expect, it } from "bun:test";
import path from "node:path";
import { parseSwapApiBase } from "./swap-api-base";

const STAGING_SWAP_API = "https://global.api.stg.ledger-test.com/swap/v5";
const PRINT_SWAP_API_BASE = path.resolve(import.meta.dir, "../testing/print-swap-api-base.ts");

/** Starts wallet-cli's setup in a new process, as the binary does, without reading any `.env`. */
async function startWith(swapApiBase: string | undefined) {
  const env = { ...process.env };
  delete env.SWAP_API_BASE;
  if (swapApiBase !== undefined) env.SWAP_API_BASE = swapApiBase;
  const proc = Bun.spawn([process.execPath, "--no-env-file", PRINT_SWAP_API_BASE], {
    env,
    stdin: "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    proc.exited,
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  return { exitCode, swapApiBase: stdout.trim(), stderr };
}

describe("SWAP_API_BASE at startup", () => {
  it("points live-common's Swap API at SWAP_API_BASE and says so on stderr", async () => {
    const started = await startWith(STAGING_SWAP_API);

    expect(started).toEqual({
      exitCode: 0,
      swapApiBase: STAGING_SWAP_API,
      stderr: `⚠ Swap API set by SWAP_API_BASE: ${STAGING_SWAP_API}\n`,
    });
  });

  it("keeps the production Swap API without SWAP_API_BASE", async () => {
    const started = await startWith(undefined);

    expect(started).toEqual({ exitCode: 0, swapApiBase: "https://swap.ledger.com/v5", stderr: "" });
  });

  it("ignores an empty SWAP_API_BASE", async () => {
    const started = await startWith("");

    expect(started).toEqual({ exitCode: 0, swapApiBase: "https://swap.ledger.com/v5", stderr: "" });
  });

  it("stops before any request when SWAP_API_BASE carries credentials", async () => {
    const started = await startWith("https://user:secret@swap.example.test/v5");

    expect(started).toEqual({
      exitCode: 1,
      swapApiBase: "",
      stderr:
        "Error: SWAP_API_BASE must be an http(s) URL without user:pass@, query or fragment.\n",
    });
  });
});

describe("parseSwapApiBase", () => {
  it("drops trailing slashes, which live-common would double in its request paths", () => {
    expect(parseSwapApiBase(`${STAGING_SWAP_API}//`)).toBe(STAGING_SWAP_API);
  });

  it.each([
    ["no scheme", "swap.example.test/v5"],
    ["not http(s)", "ftp://swap.example.test/v5"],
    ["user:pass@", "https://user:secret@swap.example.test/v5"],
    ["user@", "https://user@swap.example.test/v5"],
    ["a query", "https://swap.example.test/v5?env=stg"],
    ["a fragment", "https://swap.example.test/v5#staging"],
  ])("rejects a URL with %s", (_case, value) => {
    expect(parseSwapApiBase(value)).toBeNull();
  });
});
