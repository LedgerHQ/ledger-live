import { Readable } from "node:stream";

export type FakeTerminal = Readable & { isTTY: true; rawMode: boolean };

/** A terminal on stdin where the user types `keystrokes`, one `data` event each. */
export function terminalTyping(...keystrokes: string[]): FakeTerminal {
  const terminal = Object.assign(new Readable({ read() {} }), {
    isTTY: true as const,
    rawMode: false,
  });
  Object.assign(terminal, {
    setRawMode: (mode: boolean) => {
      terminal.rawMode = mode;
      return terminal;
    },
  });
  for (const keys of keystrokes) terminal.push(keys);
  return terminal;
}

/** Stdin redirected from a pipe or file that holds `text`. */
export function pipedStdin(text = ""): Readable {
  return Readable.from([text]);
}

/** Runs `run` with `stdin` as `process.stdin`, then puts the real one back. */
export async function withStdin<T>(stdin: Readable, run: () => Promise<T>): Promise<T> {
  const real = Object.getOwnPropertyDescriptor(process, "stdin")!;
  Object.defineProperty(process, "stdin", { get: () => stdin, configurable: true });
  try {
    return await run();
  } finally {
    Object.defineProperty(process, "stdin", real);
  }
}
