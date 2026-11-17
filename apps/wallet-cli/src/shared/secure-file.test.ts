import { describe, it, expect, afterEach } from "bun:test";
import {
  chmodSync,
  existsSync,
  type PathLike,
  mkdirSync,
  mkdtempSync,
  renameSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { _setTestRename, writeSecureFile } from "./secure-file";
import { overridePlatform } from "../testing/os-keychain";

let dir: string | undefined;
let restorePlatform: (() => void) | undefined;
afterEach(() => {
  restorePlatform?.();
  restorePlatform = undefined;
  _setTestRename(null);
  if (dir) {
    chmodSync(dir, 0o700);
    rmSync(dir, { recursive: true, force: true });
  }
  dir = undefined;
});

/** Windows' rename, which refuses to replace an existing file or directory. */
function renameAsWindows(from: PathLike, to: PathLike): void {
  if (existsSync(to)) throw Object.assign(new Error(`EPERM: rename '${from}'`), { code: "EPERM" });
  renameSync(from, to);
}

function onWindows(): void {
  restorePlatform = overridePlatform("win32");
  _setTestRename(renameAsWindows);
}

function makeDir(): string {
  dir = mkdtempSync(join(tmpdir(), "secure-file-test-"));
  return dir;
}

const isPosix = process.platform !== "win32";
// Root writes through read-only permissions.
const canBeDeniedWrites = isPosix && process.getuid?.() !== 0;
const mode = (p: string) => statSync(p).mode & 0o777;

describe("writeSecureFile", () => {
  it.skipIf(!isPosix)("creates a new file at 0600", () => {
    const dest = join(makeDir(), "secret");
    writeSecureFile(dest, Buffer.from("hello"));
    expect(mode(dest)).toBe(0o600);
    expect(readFileSync(dest, "utf8")).toBe("hello");
  });

  it.skipIf(!isPosix)(
    "tightens a pre-existing world-readable file to 0600 (the regression it guards)",
    () => {
      const dest = join(makeDir(), "secret");
      // Force a 0644 precondition regardless of the runner's umask; without the chmod a strict umask
      // would create this at 0600 and the 0644→0600 regression scenario would never run.
      writeFileSync(dest, "old");
      chmodSync(dest, 0o644);
      expect(mode(dest)).toBe(0o644);

      writeSecureFile(dest, Buffer.from("new secret"));

      expect(mode(dest)).toBe(0o600);
      expect(readFileSync(dest, "utf8")).toBe("new secret");
    },
  );

  it("creates missing parent directories (regression: writeFileSync does not, Bun.write did)", () => {
    const dest = join(makeDir(), "nested", "deep", "secret.enc");
    writeSecureFile(dest, Buffer.from("payload"));
    expect(readFileSync(dest, "utf8")).toBe("payload");
  });

  it("leaves no leftover temp files in the directory", () => {
    const d = makeDir();
    const dest = join(d, "secret");
    writeSecureFile(dest, Buffer.from("x"));
    expect(readdirSync(d)).toEqual(["secret"]);
  });

  it.skipIf(!canBeDeniedWrites)(
    "keeps the old file when the directory is read-only, even on Windows",
    () => {
      const d = makeDir();
      const dest = join(d, "secret");
      writeFileSync(dest, "old");
      chmodSync(d, 0o500);
      onWindows();

      expect(() => writeSecureFile(dest, Buffer.from("new"))).toThrow(
        expect.objectContaining({ code: "EACCES" }),
      );
      expect(readFileSync(dest, "utf8")).toBe("old");
      expect(readdirSync(d)).toEqual(["secret"]);
    },
  );

  it("keeps a directory in the way and removes its temp file", () => {
    const d = makeDir();
    const dest = join(d, "secret");
    mkdirSync(dest);
    writeFileSync(join(dest, "inside"), "kept");

    expect(() => writeSecureFile(dest, Buffer.from("new"))).toThrow();
    expect(readdirSync(d)).toEqual(["secret"]);
    expect(readFileSync(join(dest, "inside"), "utf8")).toBe("kept");
  });

  describe("on Windows, where rename won't replace a file", () => {
    it("replaces the existing file", () => {
      const d = makeDir();
      const dest = join(d, "secret");
      writeFileSync(dest, "old");
      onWindows();

      writeSecureFile(dest, Buffer.from("new"));

      expect(readFileSync(dest, "utf8")).toBe("new");
      expect(readdirSync(d)).toEqual(["secret"]);
    });

    it("reports why a directory in the way can't be removed, and keeps it", () => {
      const d = makeDir();
      const dest = join(d, "secret");
      mkdirSync(dest);
      onWindows();

      expect(() => writeSecureFile(dest, Buffer.from("new"))).toThrow(
        expect.objectContaining({ syscall: "unlink" }),
      );
      expect(readdirSync(d)).toEqual(["secret"]);
      expect(existsSync(dest)).toBe(true);
    });

    it("writes the file when another process removed the old one first", () => {
      const d = makeDir();
      const dest = join(d, "secret");
      writeFileSync(dest, "old");
      onWindows();
      let raced = false;
      _setTestRename((from, to) => {
        if (!raced) {
          raced = true;
          rmSync(to);
          throw Object.assign(new Error("EACCES: file in use"), { code: "EACCES" });
        }
        renameAsWindows(from, to);
      });

      writeSecureFile(dest, Buffer.from("new"));

      expect(readFileSync(dest, "utf8")).toBe("new");
    });
  });
});
