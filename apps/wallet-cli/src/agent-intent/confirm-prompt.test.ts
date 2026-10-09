import { afterEach, describe, expect, it } from "bun:test";
import { PassThrough } from "node:stream";
import { askToConfirm } from "./confirm-prompt";

const stdinDescriptor = Object.getOwnPropertyDescriptor(process, "stdin");
const stderrWrite = process.stderr.write.bind(process.stderr);

/** Replaces stdin with a stream fed `input`, then ended, and silences the prompt on stderr. */
function answerWith(input: string): void {
  const stdin = new PassThrough();
  Object.defineProperty(process, "stdin", { get: () => stdin, configurable: true });
  process.stderr.write = (() => true) as typeof process.stderr.write;
  stdin.end(input);
}

describe("askToConfirm", () => {
  afterEach(() => {
    if (stdinDescriptor) Object.defineProperty(process, "stdin", stdinDescriptor);
    process.stderr.write = stderrWrite;
  });

  it.each(["y\n", "Yes\n", " YES \n"])("accepts %j", async input => {
    answerWith(input);

    expect(await askToConfirm("Cancel? [y/N] ")).toBe(true);
  });

  it.each(["\n", "n\n", "no\n", "yep\n"])("declines %j", async input => {
    answerWith(input);

    expect(await askToConfirm("Cancel? [y/N] ")).toBe(false);
  });

  it("declines when stdin closes without an answer (Ctrl+D)", async () => {
    answerWith("");

    expect(await askToConfirm("Cancel? [y/N] ")).toBe(false);
  });
});
