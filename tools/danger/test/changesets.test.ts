import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findPatchBumps, isChangesetFile } from "../changesets.ts";

const changeset = (path: string, bumps: string[], summary = "Fix the send flow") => ({
  path,
  content: ["---", ...bumps, "---", "", summary, ""].join("\n"),
});

describe("findPatchBumps", () => {
  it("should report every package a changeset bumps as patch", () => {
    const file = changeset(".changeset/a.md", [
      '"live-mobile": patch',
      '"@ledgerhq/live-common": minor',
      '"@domain/entity-contact": patch',
    ]);

    assert.deepEqual(findPatchBumps([file]), [
      { path: ".changeset/a.md", packages: ["live-mobile", "@domain/entity-contact"] },
    ]);
  });

  it("should accept minor and major bumps", () => {
    const files = [
      changeset(".changeset/a.md", ['"live-mobile": minor']),
      changeset(".changeset/b.md", ['"@ledgerhq/coin-sui": major']),
    ];

    assert.deepEqual(findPatchBumps(files), []);
  });

  it("should read single-quoted and unquoted package names", () => {
    const file = changeset(".changeset/a.md", [
      "'live-mobile': patch",
      "ledger-live-desktop: patch",
    ]);

    assert.deepEqual(findPatchBumps([file])[0].packages, ["live-mobile", "ledger-live-desktop"]);
  });

  it("should ignore the word patch in the summary", () => {
    const file = changeset(".changeset/a.md", ['"live-mobile": minor'], '"live-mobile": patch');

    assert.deepEqual(findPatchBumps([file]), []);
  });
});

describe("isChangesetFile", () => {
  it("should match changeset Markdown files", () => {
    assert.equal(isChangesetFile(".changeset/brave-dogs-run.md"), true);
  });

  it("should skip the changeset README, config and files elsewhere", () => {
    assert.equal(isChangesetFile(".changeset/README.md"), false);
    assert.equal(isChangesetFile(".changeset/config.json"), false);
    assert.equal(isChangesetFile("docs/.changeset/a.md"), false);
    assert.equal(isChangesetFile(".changeset/nested/a.md"), false);
  });
});
