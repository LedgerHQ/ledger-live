"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { inferTags } = require("./plugin");

test("domain/entity/* gets scope:domain + type:domain-entity", () => {
  assert.deepEqual(inferTags("domain/entity/currency", "@domain/entity-currency"), [
    "scope:domain",
    "scope:no-apps",
    "type:domain-entity",
  ]);
  assert.deepEqual(inferTags("domain/entity/currency-fiat", "@domain/entity-currency-fiat"), [
    "scope:domain",
    "scope:no-apps",
    "type:domain-entity",
  ]);
});

test("domain/api/* gets scope:domain + type:domain-api", () => {
  assert.deepEqual(inferTags("domain/api/foo", "@domain/api-foo"), [
    "scope:domain",
    "scope:no-apps",
    "type:domain-api",
  ]);
});

test("shared/* gets scope:shared", () => {
  assert.deepEqual(inferTags("shared/feature-flags", "@shared/feature-flags"), [
    "scope:no-apps",
    "scope:shared",
  ]);
  assert.deepEqual(inferTags("shared/schema-primitives", "@shared/schema-primitives"), [
    "scope:no-apps",
    "scope:shared",
  ]);
});

test("features/* gets scope:features (regression)", () => {
  assert.deepEqual(inferTags("features/market-banner", "@features/market-banner"), [
    "scope:features",
    "scope:no-apps",
  ]);
});

test("libs/* does not pick up new-arch tags (regression)", () => {
  const libTags = inferTags("libs/ledger-live-common", "@ledgerhq/live-common");
  assert.ok(!libTags.includes("scope:domain"), `got ${libTags.join(",")}`);
  assert.ok(!libTags.includes("scope:shared"));
  assert.ok(!libTags.includes("type:domain-entity"));
  assert.ok(libTags.includes("scope:libs"));
  assert.ok(libTags.includes("type:live-common"));
});

test("apps/* still get scope:apps and not scope:no-apps (regression)", () => {
  const desktop = inferTags("apps/ledger-live-desktop", "ledger-live-desktop");
  assert.ok(desktop.includes("scope:apps"));
  assert.ok(desktop.includes("type:app-desktop"));
  assert.ok(!desktop.includes("scope:no-apps"));
  assert.ok(!desktop.includes("scope:domain"));
});

test("libs/ui/* sub-scoping still works (regression)", () => {
  assert.deepEqual(inferTags("libs/ui/packages/react", "@ledgerhq/ui-react"), [
    "scope:libs",
    "scope:libs-ui",
    "scope:no-apps",
  ]);
});

test("domain path that is not entity/ or api/ still gets scope:domain only", () => {
  assert.deepEqual(inferTags("domain/other/thing", "@domain/other-thing"), [
    "scope:domain",
    "scope:no-apps",
  ]);
});
