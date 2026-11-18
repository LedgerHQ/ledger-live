import { describe, it, expect } from "bun:test";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";
import { isUnderTemporaryDir, temporaryRoots, temporaryStateDirWarning } from "./temp-state-dir";

const TEMP_ROOT = join(tmpdir(), "wcli-root");

describe("isUnderTemporaryDir", () => {
  it("should flag a folder inside a temporary root", () => {
    expect(isUnderTemporaryDir(join(TEMP_ROOT, "agent", "ledger-wallet-cli"), [TEMP_ROOT])).toBe(
      true,
    );
  });

  it("should flag a child whose name starts with two dots", () => {
    expect(isUnderTemporaryDir(join(TEMP_ROOT, "..agent"), [TEMP_ROOT])).toBe(true);
  });

  it("should not flag a persistent folder", () => {
    expect(isUnderTemporaryDir(join(homedir(), ".local", "state"), [TEMP_ROOT])).toBe(false);
  });

  it("should not flag a folder that only shares the root's prefix", () => {
    expect(isUnderTemporaryDir(`${TEMP_ROOT}foo`, [TEMP_ROOT])).toBe(false);
  });

  it("should follow symlinks to a temporary root", () => {
    const root = mkdtempSync(join(tmpdir(), "wcli-temp-root-"));
    const linkParent = mkdtempSync(join(tmpdir(), "wcli-link-"));
    const link = join(linkParent, "state");
    try {
      try {
        symlinkSync(root, link, "junction");
      } catch {
        return; // Windows without symlink rights: nothing to check
      }
      expect(isUnderTemporaryDir(link, [root])).toBe(true);
    } finally {
      rmSync(linkParent, { recursive: true, force: true });
      rmSync(root, { recursive: true, force: true });
    }
  });
});

describe("temporaryRoots", () => {
  const home = join(TEMP_ROOT, "home", "user");

  it("should include the OS temp dir", () => {
    expect(temporaryRoots({}, TEMP_ROOT, join(homedir(), "nowhere"))).toContain(TEMP_ROOT);
  });

  it("should skip the OS temp dir when it holds the home folder", () => {
    expect(temporaryRoots({}, home, home)).not.toContain(home);
    expect(temporaryRoots({}, TEMP_ROOT, home)).not.toContain(TEMP_ROOT);
  });

  it("should include XDG_RUNTIME_DIR when set", () => {
    const runtime = join(TEMP_ROOT, "run", "user", "1000");
    expect(temporaryRoots({ XDG_RUNTIME_DIR: runtime }, TEMP_ROOT, home)).toContain(runtime);
  });
});

describe("temporaryStateDirWarning", () => {
  const dir = join(TEMP_ROOT, "ledger-wallet-cli");

  it("should start with the warning sign the other enroll warnings use", () => {
    expect(temporaryStateDirWarning(dir, "linux", [TEMP_ROOT])).toStartWith("⚠ ");
  });

  it("should name XDG_STATE_HOME outside Windows", () => {
    expect(temporaryStateDirWarning(dir, "linux", [TEMP_ROOT])).toContain("Set XDG_STATE_HOME");
  });

  it("should name LOCALAPPDATA on Windows", () => {
    expect(temporaryStateDirWarning(dir, "win32", [TEMP_ROOT])).toContain("Set LOCALAPPDATA");
  });

  it("should stay silent for a persistent folder", () => {
    expect(
      temporaryStateDirWarning(join(homedir(), ".local", "state"), "linux", [TEMP_ROOT]),
    ).toBeUndefined();
  });
});
