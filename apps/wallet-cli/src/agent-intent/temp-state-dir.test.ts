import { describe, it, expect } from "bun:test";
import { mkdtempSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";
import { isUnderTemporaryDir, temporaryStateDirWarning } from "./temp-state-dir";

const TEMP_ROOT = join(tmpdir(), "wcli-root");

describe("isUnderTemporaryDir", () => {
  it("should flag a folder inside a temporary root", () => {
    expect(isUnderTemporaryDir(join(TEMP_ROOT, "agent", "ledger-wallet-cli"), [TEMP_ROOT])).toBe(
      true,
    );
  });

  it("should not flag a persistent folder", () => {
    expect(isUnderTemporaryDir(join(homedir(), ".local", "state"), [TEMP_ROOT])).toBe(false);
  });

  it("should not flag a folder that only shares the root's prefix", () => {
    expect(isUnderTemporaryDir(`${TEMP_ROOT}foo`, [TEMP_ROOT])).toBe(false);
  });

  it("should follow symlinks to a temporary root", () => {
    const root = mkdtempSync(join(tmpdir(), "wcli-temp-root-"));
    const link = join(mkdtempSync(join(tmpdir(), "wcli-link-")), "state");
    try {
      symlinkSync(root, link, "junction");
    } catch {
      return; // Windows without symlink rights: nothing to check
    }
    expect(isUnderTemporaryDir(link, [root])).toBe(true);
  });
});

describe("temporaryStateDirWarning", () => {
  const dir = join(tmpdir(), "ledger-wallet-cli");

  it("should name XDG_STATE_HOME outside Windows", () => {
    expect(temporaryStateDirWarning(dir, "linux")).toContain("Set XDG_STATE_HOME");
  });

  it("should name LOCALAPPDATA on Windows", () => {
    expect(temporaryStateDirWarning(dir, "win32")).toContain("Set LOCALAPPDATA");
  });
});
