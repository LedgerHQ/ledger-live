"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isWatched,
  collectWatched,
  findIncompleteEntries,
  findViolations,
  parseIgnoredBuilds,
} = require("./validate");

const TREE = [
  {
    name: "live-mobile",
    dependencies: {
      "@ledgerhq/coin-bitcoin": {
        version: "link:../../libs/coin-modules/coin-bitcoin",
        dependencies: {
          "@bitcoinerlab/secp256k1": { version: "1.2.0" },
        },
      },
      "@ledgerhq/coin-icon": {
        version: "link:../../libs/coin-modules/coin-icon",
        dependencies: {
          "icon-sdk-js": {
            version: "1.5.2",
            dependencies: { secp256k1: { version: "5.0.0" } },
          },
        },
      },
    },
  },
];

const IMPLEMENTATIONS = {
  "@bitcoinerlab/secp256k1": { reason: "adapter over @noble/curves" },
  secp256k1: { tolerated: true, mustNotBuild: true, reason: "native", exit: "LIVE-37372" },
};

test("isWatched matches the patterns handed to pnpm", () => {
  for (const name of [
    "secp256k1",
    "tiny-secp256k1",
    "@bitcoin-js/tiny-secp256k1-asmjs",
    "@noble/secp256k1",
    "elliptic",
    "@noble/curves",
  ]) {
    assert.ok(isWatched(name), name);
  }
  for (const name of ["@noble/hashes", "bip32", "bitcoinjs-lib", "keccak", "ellipticool"]) {
    assert.ok(!isWatched(name), name);
  }
});

test("isWatched rejects a pattern pnpm would honour but this check would not", () => {
  for (const glob of ["bcrypto?", "{elliptic,ecurve}", "!elliptic", "elliptic[12]"]) {
    assert.throws(() => isWatched("elliptic", [glob]), /beyond "\*"/, glob);
  }
});

test("collectWatched scans every dependency field a project can declare", () => {
  for (const field of [
    "dependencies",
    "devDependencies",
    "optionalDependencies",
    "unsavedDependencies",
  ]) {
    const tree = [{ name: "ledger-live-desktop", [field]: { "tiny-secp256k1": { version: "2" } } }];
    assert.deepEqual(
      [...collectWatched(tree).keys()],
      ["tiny-secp256k1"],
      `${field} must be scanned`,
    );
  }
});

test("parseIgnoredBuilds reads the list and tolerates CRLF", () => {
  const output = [
    "Automatically ignored builds during installation:",
    "  @parcel/watcher",
    "  secp256k1",
    'hint: add its name to "pnpm.onlyBuiltDependencies", then run "pnpm rebuild".',
  ].join("\r\n");
  assert.deepEqual(parseIgnoredBuilds(output), ["@parcel/watcher", "secp256k1"]);
});

test("parseIgnoredBuilds throws rather than report a package as approved", () => {
  assert.throws(() => parseIgnoredBuilds("pnpm changed its output\n"), /could not read/);
});

test("collectWatched reports each implementation with the chain that reaches it", () => {
  assert.deepEqual(Object.fromEntries(collectWatched(TREE)), {
    "@bitcoinerlab/secp256k1": "live-mobile > @ledgerhq/coin-bitcoin > @bitcoinerlab/secp256k1",
    secp256k1: "live-mobile > @ledgerhq/coin-icon > icon-sdk-js > secp256k1",
  });
});

test("a classified tree with its builds blocked reports nothing", () => {
  assert.deepEqual(findViolations(collectWatched(TREE), ["secp256k1"], IMPLEMENTATIONS), []);
});

test("a reintroduced implementation is reported, however deep it sits", () => {
  const tree = structuredClone(TREE);
  tree[0].dependencies["@ledgerhq/coin-bitcoin"].dependencies.ecpair = {
    version: "3.0.1",
    dependencies: { "tiny-secp256k1": { version: "1.1.6" } },
  };
  assert.deepEqual(findViolations(collectWatched(tree), ["secp256k1"], IMPLEMENTATIONS), [
    "tiny-secp256k1 entered the tree: live-mobile > @ledgerhq/coin-bitcoin > ecpair > tiny-secp256k1",
  ]);
});

test("approving a native build for an implementation that must stay pure JS is reported", () => {
  assert.deepEqual(findViolations(collectWatched(TREE), [], IMPLEMENTATIONS), [
    "secp256k1 is approved to build native bindings, and must not be",
  ]);
});

test("a tolerated entry whose implementation left the tree is reported", () => {
  assert.deepEqual(findViolations(new Map(), [], IMPLEMENTATIONS), [
    "secp256k1 has left the tree — delete its entry",
  ]);
});

test("an entry without a reason, or tolerated without an exit, is reported", () => {
  assert.deepEqual(findIncompleteEntries({ foo: {} }), ["foo is classified without a reason"]);
  assert.deepEqual(findIncompleteEntries({ foo: { tolerated: true, reason: "r" } }), [
    "foo is tolerated without an exit condition",
  ]);
  assert.deepEqual(findIncompleteEntries({ foo: { reason: "r" } }), []);
  assert.deepEqual(findIncompleteEntries(), []);
});

test("findViolations refuses an incomplete entry even when the tree is clean", () => {
  const known = { "tiny-secp256k1": {} };
  const tree = [{ name: "app", dependencies: { "tiny-secp256k1": { version: "1" } } }];
  assert.deepEqual(findViolations(collectWatched(tree), [], known), [
    "tiny-secp256k1 is classified without a reason",
  ]);
});
