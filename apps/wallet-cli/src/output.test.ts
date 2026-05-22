import "./live-common-setup";
import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import { installOutputCapture } from "./shared/ui";

type MockSpinner = {
  text: string;
  isSpinning: boolean;
  start: () => MockSpinner;
  stop: () => MockSpinner;
  success: (text?: string) => MockSpinner;
  error: (text?: string) => MockSpinner;
  clear: () => MockSpinner;
};

const createdSpinners: MockSpinner[] = [];

mock.module("yocto-spinner", () => ({
  default: ({ text }: { text: string }) => {
    const spin: MockSpinner = {
      text,
      isSpinning: false,
      start() {
        this.isSpinning = true;
        return this;
      },
      stop() {
        this.isSpinning = false;
        return this;
      },
      success(text?: string) {
        if (text) this.text = text;
        this.isSpinning = false;
        return this;
      },
      error(text?: string) {
        if (text) this.text = text;
        this.isSpinning = false;
        return this;
      },
      clear() {
        return this;
      },
    };
    createdSpinners.push(spin);
    return spin;
  },
}));

const { createCommandOutput } = await import("./output");

describe("HumanCommandOutput", () => {
  const envVars = [
    "CLAUDECODE",
    "CLAUDE_CODE",
    "CURSOR_AGENT",
    "CODEX_ENABLED",
    "GEMINI_CLI",
    "OPENCODE",
    "AMP_CURRENT_THREAD_ID",
  ];

  let savedEnv: Record<string, string | undefined> = {};
  let stderrIsTTY: PropertyDescriptor | undefined;

  beforeEach(() => {
    createdSpinners.length = 0;
    savedEnv = {};
    for (const k of [...envVars, "AGENT"]) {
      savedEnv[k] = process.env[k];
      delete process.env[k];
    }
    stderrIsTTY = Object.getOwnPropertyDescriptor(process.stderr, "isTTY");
    Object.defineProperty(process.stderr, "isTTY", {
      value: true,
      configurable: true,
    });
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(savedEnv)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
    if (stderrIsTTY) {
      Object.defineProperty(process.stderr, "isTTY", stderrIsTTY);
    }
  });

  it("uses the canonical device-state text for signature requests", () => {
    const out = createCommandOutput("human", {
      command: "send",
      network: "ethereum:main",
      account: "js:2:ethereum:0x123",
    });
    const spin = out.spin("Preparing transaction…") as unknown as MockSpinner;

    out.sendEvent({ type: "device-signature-requested" });

    expect(spin.text).toBe("[⧖] Review on device. Approve or reject.");
    expect(createdSpinners).toHaveLength(1);
  });

  it("emits a plain greppable `hash: <txHash>` line to stdout on broadcasted", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const writes: string[] = [];
    const restore = installOutputCapture({
      stdout: chunk => {
        writes.push(chunk);
      },
    });
    try {
      const out = createCommandOutput("human", {
        command: "send",
        network: "ethereum:main",
        account: "js:2:ethereum:0x123",
      });
      out.spin("Broadcasting…");
      out.sendEvent({ type: "broadcasted", txHash: "0xdeadbeef" });
    } finally {
      restore();
    }
    expect(writes.join("")).toContain("hash: 0xdeadbeef");
  });

  it("token() writes the formatted token info to stdout", async () => {
    const { installOutputCapture } = await import("./shared/ui");
    const { USDT_TOKEN_INFO } = await import("./test/helpers/cal-fixtures");
    const writes: string[] = [];
    const restore = installOutputCapture({
      stdout: chunk => {
        writes.push(chunk);
      },
    });
    try {
      const out = createCommandOutput("human", {
        command: "assets token",
        network: "ethereum",
      });
      out.token(USDT_TOKEN_INFO);
    } finally {
      restore();
    }
    const joined = writes.join("");
    expect(joined).toContain(USDT_TOKEN_INFO.id);
    expect(joined).toContain(USDT_TOKEN_INFO.ticker);
    expect(joined).toContain(USDT_TOKEN_INFO.contractAddress);
  });

  describe("ring human output", () => {
    let writes: string[] = [];
    let stderrWrites: string[] = [];
    let restore: () => void;

    beforeEach(() => {
      writes = [];
      stderrWrites = [];
      restore = installOutputCapture({
        stdout: chunk => writes.push(chunk),
        stderr: chunk => stderrWrites.push(chunk),
      });
    });

    afterEach(() => restore());

    const ctx = { command: "ring", network: "all" };

    it("ringKeys renders a table with key and date columns", () => {
      createCommandOutput("human", ctx).ringKeys([
        { domain: "prod", firstUsed: "2026-04-27T12:00:00.000Z" },
        { domain: "staging", firstUsed: "2026-04-28T12:00:00.000Z" },
      ]);
      const out = writes.join("");
      expect(out).toContain("prod");
      expect(out).toContain("staging");
      expect(out).toContain("2026-04-27");
      expect(out).toContain("2026-04-28");
    });

    it("ringKeys renders dim message when empty", () => {
      createCommandOutput("human", ctx).ringKeys([]);
      expect(writes.join("")).toContain("No keys");
    });

    it("ringDestroy shows destroyed message when remote succeeded", () => {
      createCommandOutput("human", ctx).ringDestroy(true);
      expect(writes.join("")).toContain("Ledger Key Ring destroyed");
    });

    it("ringDestroy shows local-wipe message when remote failed", () => {
      createCommandOutput("human", ctx).ringDestroy(false);
      expect(writes.join("")).toContain("local credentials wiped");
    });

    it("ringDestroyCancelled writes Cancelled to stderr", () => {
      createCommandOutput("human", ctx).ringDestroyCancelled();
      expect(stderrWrites.join("")).toContain("Cancelled");
    });

    it("ringEncrypt shows written path and byte count", () => {
      createCommandOutput("human", ctx).ringEncrypt({ dest: "/tmp/out.enc", bytes: 128 });
      const out = writes.join("");
      expect(out).toContain("/tmp/out.enc");
      expect(out).toContain("128");
    });

    it("ringDecrypt shows written path", () => {
      createCommandOutput("human", ctx).ringDecrypt({ dest: "/tmp/out.txt" });
      expect(writes.join("")).toContain("/tmp/out.txt");
    });
  });
});
