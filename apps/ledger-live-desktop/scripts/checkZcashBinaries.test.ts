import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Arch } from "electron-builder";
import CheckZcashBinaries from "./checkZcashBinaries";

// The real electron-builder loads ESM-only dependencies that Jest cannot require, and the check only
// needs its Arch enum (builder-util `src/arch.ts`).
jest.mock("electron-builder", () => {
  const values = { ia32: 0, x64: 1, armv7l: 2, arm64: 3, universal: 4 };
  return {
    Arch: { ...values, ...Object.fromEntries(Object.entries(values).map(([k, v]) => [v, k])) },
  };
});

const { default: checkZcashBinaries } = CheckZcashBinaries;

const PRODUCT = "Ledger Wallet";

let appOutDir: string;

beforeEach(() => {
  appOutDir = fs.mkdtempSync(path.join(os.tmpdir(), "zcash-binaries-"));
});

afterEach(() => {
  fs.rmSync(appOutDir, { recursive: true, force: true });
});

function unpackedDir(platform: string): string {
  const resources =
    platform === "darwin" || platform === "mas"
      ? path.join(appOutDir, `${PRODUCT}.app`, "Contents/Resources")
      : path.join(appOutDir, "resources");
  return path.join(resources, "app.asar.unpacked/node_modules/@ledgerhq");
}

function addBinaries(platform: string, targets: string[]): void {
  for (const target of targets) {
    const dir = path.join(unpackedDir(platform), `zcash-utils-${target}`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `index.${target}.node`), "");
  }
}

// The check builds its paths with path.join, so they use the host's separator.
function binary(target: string): string {
  return path.join(`zcash-utils-${target}`, `index.${target}.node`);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function check(platform: string, arch: Arch): () => void {
  return () =>
    checkZcashBinaries({
      appOutDir,
      arch,
      electronPlatformName: platform,
      packager: { appInfo: { productFilename: PRODUCT } },
    });
}

// Each afterPack call and the zcash-utils packages it must find. A universal mac build calls
// afterPack on its x64 slice, its arm64 slice, then the merged app.
const TARGETS: [string, Arch, string[]][] = [
  ["darwin", Arch.x64, ["darwin-x64"]],
  ["darwin", Arch.arm64, ["darwin-arm64"]],
  ["darwin", Arch.universal, ["darwin-arm64", "darwin-x64"]],
  ["mas", Arch.x64, ["darwin-x64"]],
  ["mas", Arch.arm64, ["darwin-arm64"]],
  ["mas", Arch.universal, ["darwin-arm64", "darwin-x64"]],
  ["linux", Arch.x64, ["linux-x64-gnu"]],
  ["win32", Arch.x64, ["win32-x64-msvc"]],
];

describe("checkZcashBinaries", () => {
  it.each(TARGETS)("passes for %s %s when the app holds %j", (platform, arch, targets) => {
    addBinaries(platform, targets);

    expect(check(platform, arch)).not.toThrow();
  });

  it.each(TARGETS)(
    "fails for %s %s and lists %j when they are missing",
    (platform, arch, targets) => {
      expect(check(platform, arch)).toThrow(
        new RegExp(targets.map(target => escapeRegExp(binary(target))).join("[\\s\\S]*")),
      );
    },
  );

  it.each(["darwin", "mas"])(
    "fails a universal %s app that only holds the arm64 binary, naming only darwin-x64",
    platform => {
      addBinaries(platform, ["darwin-arm64"]);

      let message = "";
      try {
        check(platform, Arch.universal)();
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }

      expect(message).toContain(binary("darwin-x64"));
      expect(message).not.toContain("index.darwin-arm64.node");
    },
  );

  it("does not count a binary unpacked under another platform's layout", () => {
    addBinaries("darwin", ["linux-x64-gnu"]);

    expect(check("linux", Arch.x64)).toThrow(/zcash-utils binaries missing/);
  });

  it.each([
    ["linux", Arch.arm64],
    ["win32", Arch.arm64],
    ["darwin", Arch.ia32],
  ])("fails for %s %s, which has no zcash-utils package", (platform, arch) => {
    expect(check(platform, arch)).toThrow(
      `zcash-utils has no package for ${platform} ${Arch[arch]}.`,
    );
  });

  it("ignores a platform it does not package", () => {
    expect(check("freebsd", Arch.x64)).not.toThrow();
  });
});
