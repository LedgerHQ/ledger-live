import { describe, expect, it } from "bun:test";
import packageJson from "../package.json";
import {
  WALLET_CLI_VERSION,
  resolveWalletCliReleaseChannel,
  type WalletCliReleaseChannel,
} from "./build-metadata";

describe("build metadata", () => {
  it("uses the package version", () => {
    expect(WALLET_CLI_VERSION).toBe(packageJson.version);
  });

  it.each([
    ["stable", "stable"],
    ["next", "prerelease"],
    [undefined, "prerelease"],
    ["", "prerelease"],
    ["nightly", "prerelease"],
  ] as const)("resolves %p to %p", (input, expected) => {
    expect(resolveWalletCliReleaseChannel(input)).toBe(expected);
  });

  it("returns a typed release channel", () => {
    const value: WalletCliReleaseChannel = resolveWalletCliReleaseChannel("stable");
    expect(value).toBe("stable");
  });
});
