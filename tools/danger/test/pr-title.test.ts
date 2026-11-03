import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lintPrTitle } from "../commitlint.ts";
import { stripPlatformPrefix } from "../pull-request.ts";

const baseTitle = `fix(scope): ${"a".repeat(60)}`;

async function isValidTitle(title: string): Promise<boolean> {
  return (await lintPrTitle(stripPlatformPrefix(title))).valid;
}

describe("PR title length", () => {
  it("should accept a 72-character base title", async () => {
    assert.equal(baseTitle.length, 72);
    assert.equal(await isValidTitle(baseTitle), true);
  });

  it("should reject a base title longer than 72 characters", async () => {
    assert.equal(await isValidTitle(`${baseTitle}a`), false);
  });

  it("should allow each automated platform prefix in addition to the base title", async () => {
    for (const [prefix, finalLength] of [
      ["[LWD] ", 78],
      ["[LWM] ", 78],
      ["[LWDM] ", 79],
    ]) {
      const title = `${prefix}${baseTitle}`;
      assert.equal(title.length, finalLength);
      assert.equal(await isValidTitle(title), true);
    }
  });

  it("should reject a title whose base exceeds 72 characters after an automated prefix", async () => {
    assert.equal(await isValidTitle(`[LWM] ${baseTitle}a`), false);
  });

  it("should only strip the exact prefixes produced by title automation", () => {
    assert.equal(stripPlatformPrefix(`[LWM] ${baseTitle}`), baseTitle);
    assert.equal(stripPlatformPrefix(`[LWM]\t${baseTitle}`), `[LWM]\t${baseTitle}`);
    assert.equal(stripPlatformPrefix(`[OTHER] ${baseTitle}`), `[OTHER] ${baseTitle}`);
  });
});
