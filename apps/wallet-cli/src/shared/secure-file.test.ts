import { describe, it, expect, afterEach } from "bun:test";
import {
  chmodSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeSecureFile } from "./secure-file";

let dir: string | undefined;
afterEach(() => {
  if (dir) rmSync(dir, { recursive: true, force: true });
  dir = undefined;
});

function makeDir(): string {
  dir = mkdtempSync(join(tmpdir(), "secure-file-test-"));
  return dir;
}

const mode = (p: string) => statSync(p).mode & 0o777;

describe("writeSecureFile", () => {
  it("creates a new file at 0600", () => {
    const dest = join(makeDir(), "secret");
    writeSecureFile(dest, Buffer.from("hello"));
    expect(mode(dest)).toBe(0o600);
    expect(readFileSync(dest, "utf8")).toBe("hello");
  });

  it("tightens a pre-existing world-readable file to 0600 (the regression it guards)", () => {
    const dest = join(makeDir(), "secret");
    // Force a 0644 precondition regardless of the runner's umask; without the chmod a strict umask
    // would create this at 0600 and the 0644→0600 regression scenario would never run.
    writeFileSync(dest, "old");
    chmodSync(dest, 0o644);
    expect(mode(dest)).toBe(0o644);

    writeSecureFile(dest, Buffer.from("new secret"));

    expect(mode(dest)).toBe(0o600);
    expect(readFileSync(dest, "utf8")).toBe("new secret");
  });

  it("creates missing parent directories (regression: writeFileSync does not, Bun.write did)", () => {
    const dest = join(makeDir(), "nested", "deep", "secret.enc");
    writeSecureFile(dest, Buffer.from("payload"));
    expect(readFileSync(dest, "utf8")).toBe("payload");
    expect(mode(dest)).toBe(0o600);
  });

  it("leaves no leftover temp files in the directory", () => {
    const d = makeDir();
    const dest = join(d, "secret");
    writeSecureFile(dest, Buffer.from("x"));
    expect(readdirSync(d)).toEqual(["secret"]);
  });
});
