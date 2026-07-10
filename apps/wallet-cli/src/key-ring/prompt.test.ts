import { describe, it, expect, afterEach } from "bun:test";
import { EventEmitter } from "node:events";
import { promptHidden } from "./prompt";

const origStdin = Object.getOwnPropertyDescriptor(process, "stdin");
const origPass = process.env.WALLET_PASS;

afterEach(() => {
  if (origStdin) Object.defineProperty(process, "stdin", origStdin);
  if (origPass === undefined) delete process.env.WALLET_PASS;
  else process.env.WALLET_PASS = origPass;
});

// Drive promptHidden's TTY branch with a fake raw-mode stdin, emitting the given data chunks.
function promptWithChunks(chunks: string[]): Promise<string> {
  delete process.env.WALLET_PASS;
  const stdin = new EventEmitter() as EventEmitter & Record<string, unknown>;
  stdin.isTTY = true;
  stdin.setRawMode = () => stdin;
  stdin.resume = () => stdin;
  stdin.pause = () => stdin;
  stdin.setEncoding = () => stdin;
  Object.defineProperty(process, "stdin", { get: () => stdin, configurable: true });

  const result = promptHidden("Password: ");
  // The Promise executor attaches the "data" listener synchronously, so emitting now is safe.
  for (const c of chunks) stdin.emit("data", c);
  return result.then(r => r.value);
}

describe("promptHidden", () => {
  it("submits a password delivered as one batched chunk with a trailing newline", async () => {
    expect(await promptWithChunks(["secret\n"])).toBe("secret");
  });

  it("handles a password split across multiple chunks", async () => {
    expect(await promptWithChunks(["se", "cr", "et", "\r"])).toBe("secret");
  });

  it("submits at the newline and ignores trailing bytes in the same chunk", async () => {
    // Regression guard: the old per-chunk code appended "sec\nIGNORED" verbatim and never submitted.
    expect(await promptWithChunks(["sec\nIGNORED"])).toBe("sec");
  });

  it("applies a backspace embedded mid-chunk", async () => {
    expect(await promptWithChunks(["ab\x7fc\n"])).toBe("ac");
  });

  it("reads WALLET_PASS without touching the TTY", async () => {
    process.env.WALLET_PASS = "from-env";
    expect(await promptHidden("Password: ")).toEqual({ source: "env", value: "from-env" });
  });

  it("reports the tty source for an interactively-typed password", async () => {
    delete process.env.WALLET_PASS;
    const stdin = new EventEmitter() as EventEmitter & Record<string, unknown>;
    stdin.isTTY = true;
    stdin.setRawMode = () => stdin;
    stdin.resume = () => stdin;
    stdin.pause = () => stdin;
    stdin.setEncoding = () => stdin;
    Object.defineProperty(process, "stdin", { get: () => stdin, configurable: true });
    const result = promptHidden("Password: ");
    stdin.emit("data", "pw\n");
    expect(await result).toEqual({ source: "tty", value: "pw" });
  });
});
