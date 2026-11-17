import { afterEach, beforeEach, describe, expect, it, spyOn } from "bun:test";
import path from "node:path";
import { getSwapAPIBaseURL } from "@ledgerhq/live-common/exchange/swap/index";
import { getEnv, getEnvDefault, setEnv } from "@shared/env";
import { applySwapApiBaseOverride, parseSwapApiBase } from "./swap-api-base";
import { installOutputCapture } from "./ui";

const STAGING_SWAP_API = "https://global.api.stg.ledger-test.com/swap/v5";
const PRODUCTION_SWAP_API = "https://swap.ledger.com/v5";
const PRINT_SWAP_API_BASE = path.resolve(import.meta.dir, "../testing/print-swap-api-base.ts");

describe("SWAP_API_BASE at startup", () => {
  // A fresh process, as only the binary's startup reads SWAP_API_BASE; no `.env` is read.
  it("points live-common's Swap API at SWAP_API_BASE and says so on stderr", async () => {
    const proc = Bun.spawn([process.execPath, "--no-env-file", PRINT_SWAP_API_BASE], {
      env: { ...process.env, SWAP_API_BASE: STAGING_SWAP_API },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    const [exitCode, stdout, stderr] = await Promise.all([
      proc.exited,
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);

    expect({ exitCode, swapApiBase: stdout.trim(), stderr }).toEqual({
      exitCode: 0,
      swapApiBase: STAGING_SWAP_API,
      stderr: `⚠ Swap API set by SWAP_API_BASE: ${STAGING_SWAP_API}\n`,
    });
  });
});

describe("applySwapApiBaseOverride", () => {
  let previousSwapApiBase: string;
  let stderr: string;
  let restoreStderr: () => void;

  beforeEach(() => {
    previousSwapApiBase = getEnv("SWAP_API_BASE");
    setEnv("SWAP_API_BASE", getEnvDefault("SWAP_API_BASE"));
    stderr = "";
    restoreStderr = installOutputCapture({ stderr: text => (stderr += text) });
  });
  afterEach(() => {
    restoreStderr();
    setEnv("SWAP_API_BASE", previousSwapApiBase);
  });

  it("keeps the production Swap API without SWAP_API_BASE", () => {
    applySwapApiBaseOverride({});

    expect(getSwapAPIBaseURL()).toBe(PRODUCTION_SWAP_API);
    expect(stderr).toBe("");
  });

  it("ignores an empty SWAP_API_BASE", () => {
    applySwapApiBaseOverride({ SWAP_API_BASE: "" });

    expect(getSwapAPIBaseURL()).toBe(PRODUCTION_SWAP_API);
    expect(stderr).toBe("");
  });

  it("stops before any request when SWAP_API_BASE carries credentials", () => {
    const exit = spyOn(process, "exit").mockImplementation(code => {
      throw new Error(`exit ${code}`);
    });
    try {
      expect(() =>
        applySwapApiBaseOverride({ SWAP_API_BASE: "https://user:secret@swap.example.test/v5" }),
      ).toThrow("exit 1");
    } finally {
      exit.mockRestore();
    }

    expect(getSwapAPIBaseURL()).toBe(PRODUCTION_SWAP_API);
    expect(stderr).toBe(
      "Error: SWAP_API_BASE must be an http(s) URL without user:pass@, query or fragment.\n",
    );
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
