import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { APP_IDS, knownAppId } from "./create.ts";

describe("knownAppId", () => {
  it("takes each of the app's ids", () => {
    for (const id of APP_IDS) assert.equal(knownAppId(id), id);
  });

  it("refuses any other id, an option of adb or simctl above all", () => {
    for (const id of ["com.ledger.livex", "--user", "-d", ""]) {
      assert.throws(() => knownAppId(id), /--app-id must be one of the app's ids/);
    }
  });
});
