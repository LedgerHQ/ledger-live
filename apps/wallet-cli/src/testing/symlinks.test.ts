import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import { dirname } from "node:path";
import { probeFileSymlink } from "./symlinks";

const failWith = (code: string) => () => {
  throw Object.assign(new Error(`symlink failed: ${code}`), { code });
};

describe("probeFileSymlink", () => {
  it("reports support and removes its probe dir when the link is created", () => {
    const probeDirs: string[] = [];

    const supported = probeFileSymlink((_target, link) => {
      probeDirs.push(dirname(String(link)));
    });

    expect(supported).toBe(true);
    expect(probeDirs).toHaveLength(1);
    expect(existsSync(probeDirs[0])).toBe(false);
  });

  it("reports no support when creating the link fails with EPERM", () => {
    expect(probeFileSymlink(failWith("EPERM"))).toBe(false);
  });

  it("rethrows any other failure", () => {
    expect(() => probeFileSymlink(failWith("EIO"))).toThrow("symlink failed: EIO");
  });
});
