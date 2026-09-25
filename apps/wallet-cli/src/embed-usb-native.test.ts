import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const SOURCE = path.resolve(import.meta.dir, "embed-usb-native.ts");
const PREBUILDS_ROOT = path.resolve(import.meta.dir, "..", "node_modules", "usb", "prebuilds");

// The addon each platform must get. Bun resolves the require() literals at compile time per
// --target, so a branch pointing at the wrong prebuild still builds, and still passes an
// existence check, because every prebuild exists in the package — only the mapping catches it.
const EXPECTED_ADDONS: Record<string, string> = {
  darwin: "darwin-x64+arm64/node.napi.node",
  "linux:x64": "linux-x64/node.napi.glibc.node",
  "linux:arm64": "linux-arm64/node.napi.armv8.node",
  win32: "win32-x64/node.napi.node",
};

function parseAddonMapping(): Record<string, string> {
  const source = readFileSync(SOURCE, "utf8");
  const mapping: Record<string, string> = {};

  for (const [, condition, prebuild] of source.matchAll(
    /if \(([^)]+)\)[\s\S]*?prebuilds\/([^"]+)"/g,
  )) {
    const platform = condition.match(/platform === "(\w+)"/)?.[1];
    const arch = condition.match(/arch === "(\w+)"/)?.[1];
    if (platform) {
      mapping[arch ? `${platform}:${arch}` : platform] = prebuild;
    }
  }

  return mapping;
}

const hostIsSupported =
  process.platform === "darwin" ||
  (process.platform === "win32" && process.arch === "x64") ||
  (process.platform === "linux" && (process.arch === "x64" || process.arch === "arm64"));

const ADDON_GLOBAL = "__usbNativeAddon";
const globals = globalThis as Record<string, unknown>;

describe("embed-usb-native", () => {
  it("maps every platform to its own prebuilt addon", () => {
    expect(parseAddonMapping()).toEqual(EXPECTED_ADDONS);
  });

  it.each(Object.entries(EXPECTED_ADDONS))("usb ships the %s addon (%s)", (_platform, prebuild) => {
    expect(existsSync(path.join(PREBUILDS_ROOT, prebuild))).toBe(true);
  });

  // Required inside the test, not at module scope: on a host whose prebuild cannot load (win32 arm64,
  // musl) it throws, which at load time would also fail the platform-independent tests.
  it.skipIf(!hostIsSupported)("exposes the native addon on globalThis", () => {
    require("./embed-usb-native");

    expect(globals[ADDON_GLOBAL]).toBeTruthy();
  });

  // A sentinel, because without the patch node-gyp-build loads the very same cached .node file,
  // so comparing against the real addon would pass either way.
  it("usb bindings prefer the addon on globalThis", () => {
    const bindingsPath = require.resolve("usb/dist/usb/bindings.js");
    const hadAddon = ADDON_GLOBAL in globals;
    const previousAddon = globals[ADDON_GLOBAL];
    const sentinel = {};
    globals[ADDON_GLOBAL] = sentinel;
    delete require.cache[bindingsPath];

    try {
      expect(require(bindingsPath)).toBe(sentinel);
    } finally {
      if (hadAddon) {
        globals[ADDON_GLOBAL] = previousAddon;
      } else {
        delete globals[ADDON_GLOBAL];
      }
      delete require.cache[bindingsPath];
    }
  });
});
