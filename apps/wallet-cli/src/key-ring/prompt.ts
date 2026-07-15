import { openSync } from "node:fs";
import { ReadStream } from "node:tty";

/**
 * Where a password came from, so `ring destroy` can tell a deliberate empty skip (typed at the tty)
 * from an empty `WALLET_PASS` (a mistake, e.g. a failed `$(security …)` substitution).
 */
export type PromptResult = { source: "env" | "tty"; value: string };

/**
 * Read a hidden line from a raw-mode terminal stream, resolving on Enter. Iterates per code point
 * because one `data` event can carry several chars (paste, fast typing), so a pasted "secret\n"
 * must submit rather than be appended verbatim.
 */
function readRawHidden(stream: NodeJS.ReadStream, onClose: () => void): Promise<PromptResult> {
  return new Promise<PromptResult>((resolve, reject) => {
    let value = "";
    stream.setRawMode(true);
    stream.resume();
    stream.setEncoding("utf8");

    const onData = (chunk: string) => {
      for (const ch of chunk) {
        if (ch === "\r" || ch === "\n") {
          teardown();
          resolve({ source: "tty", value });
          return;
        } else if (ch === "") {
          // Ctrl-C
          teardown();
          reject(new Error("Cancelled"));
          return;
        } else if (ch === "" || ch === "\b") {
          // DEL / Backspace
          value = value.slice(0, -1);
        } else {
          value += ch;
        }
      }
    };

    const teardown = () => {
      stream.setRawMode(false);
      stream.off("data", onData);
      onClose();
      process.stderr.write("\n");
    };

    stream.on("data", onData);
  });
}

/**
 * Open the controlling terminal (`/dev/tty`) for reading. Returns null when there is none (Windows,
 * or detached from a terminal in CI), so the caller can fall back to WALLET_PASS guidance.
 */
function openControllingTty(): { stream: NodeJS.ReadStream; close: () => void } | null {
  let fd: number;
  try {
    fd = openSync("/dev/tty", "r");
  } catch {
    return null;
  }
  const stream = new ReadStream(fd);
  // Swallow any late close/read error so it never surfaces as an unhandled error at teardown.
  stream.on("error", () => {});
  return {
    stream,
    // destroy() closes the underlying fd; do NOT also closeSync(fd) — the two races each other and
    // the loser hits an already-closed descriptor (EBADF on close).
    close: () => stream.destroy(),
  };
}

export async function promptHidden(label: string): Promise<PromptResult> {
  const envPass = process.env.WALLET_PASS;
  if (envPass !== undefined) return { source: "env", value: envPass };

  if (process.stdin.isTTY) {
    process.stderr.write(label);
    return readRawHidden(process.stdin, () => process.stdin.pause());
  }

  // stdin is piped/redirected (`echo … | wallet-cli ring encrypt`), so reading the password from it
  // would consume the payload. Fall back to /dev/tty like git/ssh/sudo. Unavailable on Windows or
  // in CI; those must inject WALLET_PASS.
  const tty = openControllingTty();
  if (tty) {
    process.stderr.write(label);
    return readRawHidden(tty.stream, tty.close);
  }

  throw new Error(
    "Password required but no TTY available and WALLET_PASS is not set.\n" +
      "Inject it from your OS keychain before running the command:\n" +
      "  macOS : WALLET_PASS=$(security find-generic-password -a default -s ledger-wallet-cli -w) wallet-cli ...\n" +
      "  Linux : WALLET_PASS=$(secret-tool lookup service ledger-wallet-cli account default) wallet-cli ...\n" +
      "  Win   : $env:WALLET_PASS=(Get-StoredCredential -Target ledger-wallet-cli).GetNetworkCredential().Password; wallet-cli ...",
  );
}
