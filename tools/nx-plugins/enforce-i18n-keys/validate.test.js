const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { extractKeys, flatten, hasKey } = require("./validate");

function keysOf(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-keys-"));
  const file = path.join(dir, "view.tsx");
  fs.writeFileSync(file, source);
  return extractKeys(file).map(k => k.key);
}

describe("extractKeys", () => {
  it("finds literal t() keys and Trans i18nKey", () => {
    assert.deepStrictEqual(
      keysOf(
        `t("a.b"); t(\`c.d\`); const x = <Trans i18nKey="e.f" />; const y = <Trans i18nKey={"g.h"} />;`,
      ),
      ["a.b", "c.d", "e.f", "g.h"],
    );
  });

  it("resolves same-file string consts in templates", () => {
    assert.deepStrictEqual(keysOf("const P = 'x.y'; t(`${P}.title`); t(P);"), ["x.y.title", "x.y"]);
  });

  it("skips keys that depend on runtime values", () => {
    assert.deepStrictEqual(keysOf("t(key); t(`a.${stage}.b`); t(fn(x));"), []);
  });
});

describe("hasKey", () => {
  const catalog = flatten({ a: { b: "B", count_one: "1", count_other: "n" } }, "", new Set());

  it("matches nested keys", () => assert.ok(hasKey(catalog, "a.b")));
  it("matches plural forms by base key", () => assert.ok(hasKey(catalog, "a.count")));
  it("rejects unknown keys", () => assert.ok(!hasKey(catalog, "a.c")));
});
