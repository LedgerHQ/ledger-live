const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { extractKeys, findMissingKeys, flatten, hasKey, consumersOf } = require("./validate");

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-keys-"));

function write(name, source) {
  const file = path.join(tmp, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, source);
  return file;
}

function sitesOf(source, name = "view.tsx") {
  return extractKeys(write(name, source));
}

function keysOf(source) {
  return sitesOf(source).flatMap(s => s.keys.map(k => k.key));
}

function kindsOf(source) {
  return sitesOf(source).map(s => s.kind);
}

describe("extractKeys: literals", () => {
  it("finds literal t() keys and Trans i18nKey", () => {
    assert.deepStrictEqual(
      keysOf(
        `t("a.b"); t(\`c.d\`); const x = <Trans i18nKey="e.f" />; const y = <Trans i18nKey={"g.h"} />;`,
      ),
      ["a.b", "c.d", "e.f", "g.h"],
    );
  });

  it("unwraps as const, parentheses and satisfies", () => {
    assert.deepStrictEqual(keysOf(`t("a" as const); t(("b")); t("c" satisfies string);`), [
      "a",
      "b",
      "c",
    ]);
  });

  it("resolves const strings through the type checker", () => {
    assert.deepStrictEqual(keysOf("const P = 'x.y'; t(`${P}.title`); t(P);"), ["x.y.title", "x.y"]);
  });
});

describe("extractKeys: translation function bindings", () => {
  it("recognises i18n.t, translate, and renamed destructuring", () => {
    const source = `
      import { t as it } from "i18next";
      const { t: tr } = useTranslation();
      const tp = useTranslation(undefined, { keyPrefix: "p" }).t;
      i18n.t("a"); it("b"); tr("c"); props.i18n.t("d"); tp("e");
    `;
    assert.deepStrictEqual(keysOf(source), ["a", "b", "c", "d", "p.e"]);
  });

  it("ignores t/translate bindings without i18n provenance", () => {
    const source = `
      import { translate } from "./slug";
      function t2() {}
      function translate2(v: string) { return v; }
      const { t } = timer; t("start");
      const alias = obj.t; alias("x");
      function translate(v: string) { return v; } translate("slug");
      const row = <Row i18nKey="id" />;
    `;
    assert.deepStrictEqual(keysOf(source), []);
  });

  it("recognises function-scoped destructuring and member access", () => {
    const source = `
      function useX() {
        const { t } = useTranslation("app");
        const fn = useTranslation().t;
        fn("b");
        return t("a");
      }
    `;
    assert.deepStrictEqual(keysOf(source), ["b", "a"]);
  });

  it("recognises a direct useTranslation().t call, with its keyPrefix", () => {
    assert.deepStrictEqual(
      keysOf(`useTranslation().t("a"); useTranslation(undefined, { keyPrefix: "p" }).t("b");`),
      ["a", "p.b"],
    );
  });

  it("ignores unrelated callees", () => {
    assert.deepStrictEqual(keysOf(`track("a"); obj.t2("b"); const { x } = f(); x("c");`), []);
  });

  it("ignores a translate parameter (local callback, not i18n)", () => {
    assert.deepStrictEqual(
      keysOf(`function f(translate: (k: "today") => string) { translate("today"); }`),
      [],
    );
  });

  it("prefixes keyPrefix from useTranslation options", () => {
    assert.deepStrictEqual(
      keysOf(`const { t } = useTranslation(undefined, { keyPrefix: "payTab" }); t("title");`),
      ["payTab.title"],
    );
  });

  it("resolves a shorthand keyPrefix and context", () => {
    assert.deepStrictEqual(
      keysOf(
        `const keyPrefix = "payTab" as const; const { t } = useTranslation(undefined, { keyPrefix }); t("title");`,
      ),
      ["payTab.title"],
    );
    const [site] = sitesOf(`const context = "male" as const; t("a", { context });`);
    assert.deepStrictEqual(site.keys[0].contexts, ["male"]);
  });

  it("combines a finite keyPrefix union with the keys, unverifiable when unresolved", () => {
    assert.deepStrictEqual(
      keysOf(
        `declare const p: "a" | "b"; const { t } = useTranslation(undefined, { keyPrefix: p }); t("title");`,
      ),
      ["a.title", "b.title"],
    );
    assert.deepStrictEqual(
      kindsOf(
        `declare const p: string; const { t } = useTranslation(undefined, { keyPrefix: p }); t("title");`,
      ),
      ["unverifiable"],
    );
  });

  it("reads quoted option names", () => {
    assert.deepStrictEqual(
      keysOf(`const { t } = useTranslation(undefined, { "keyPrefix": "p" }); t("a");`),
      ["p.a"],
    );
    const [site] = sitesOf(`t("a", { "context": "male", "count": 2 });`);
    assert.deepStrictEqual(site.keys[0].contexts, ["male"]);
    assert.strictEqual(site.keys[0].plural, true);
  });

  it("caps the combined prefix x key cardinality", () => {
    const union = n => Array.from({ length: n }, (_, i) => `"v${i}"`).join(" | ");
    assert.deepStrictEqual(
      kindsOf(
        `declare const p: ${union(20)}; declare const k: ${union(20)}; const { t } = useTranslation(undefined, { keyPrefix: p }); t(k);`,
      ),
      ["enumerated"],
    );
    assert.deepStrictEqual(
      kindsOf(
        `declare const p: ${union(30)}; declare const k: ${union(20)}; const { t } = useTranslation(undefined, { keyPrefix: p }); t(k);`,
      ),
      ["unverifiable"],
    );
  });

  it("strips the namespace prefix", () => {
    assert.deepStrictEqual(keysOf(`t("common:a.b");`), ["a.b"]);
  });

  it("collects literal and enumerated context", () => {
    const [site] = sitesOf(`t("a", { context: "male" }); `);
    assert.deepStrictEqual(site.keys, [{ key: "a", contexts: ["male"], plural: false, ns: null }]);
    const [union] = sitesOf(`declare const c: "x" | "y"; t("a", { context: c });`);
    assert.deepStrictEqual(union.keys[0].contexts, ["x", "y"]);
  });
});

describe("extractKeys: type-enumerated dynamic keys", () => {
  it("enumerates a union-typed identifier", () => {
    const source = `type K = "a.x" | "a.y"; declare const k: K; t(k);`;
    assert.deepStrictEqual(keysOf(source), ["a.x", "a.y"]);
    assert.deepStrictEqual(kindsOf(source), ["enumerated"]);
  });

  it("enumerates the cartesian product of template spans", () => {
    const source = `
      declare const variant: "buy" | "sell";
      declare const part: "title" | "body";
      t(\`flow.\${variant}.\${part}\`);
    `;
    assert.deepStrictEqual(keysOf(source), [
      "flow.buy.title",
      "flow.buy.body",
      "flow.sell.title",
      "flow.sell.body",
    ]);
  });

  it("enumerates property access over an as const record", () => {
    const source = `
      const COPY = { a: { titleKey: "t.a" }, b: { titleKey: "t.b" } } as const;
      declare const id: "a" | "b";
      t(COPY[id].titleKey);
    `;
    assert.deepStrictEqual(keysOf(source), ["t.a", "t.b"]);
  });

  it("enumerates both branches of a conditional", () => {
    assert.deepStrictEqual(keysOf(`declare const f: boolean; t(f ? "a" : "b");`), ["a", "b"]);
  });

  it("enumerates a union-typed function result", () => {
    const source = `function key(): "a" | "b" { return "a"; } t(key());`;
    assert.deepStrictEqual(keysOf(source), ["a", "b"]);
  });

  it("marks plain string, any and open templates as unverifiable", () => {
    assert.deepStrictEqual(
      kindsOf("declare const s: string; declare const a: any; t(s); t(a); t(`x.${s}`); t(fn(1));"),
      ["unverifiable", "unverifiable", "unverifiable", "unverifiable"],
    );
  });

  it("resolves types across relative imports", () => {
    write("keys.ts", `export type Key = "m.a" | "m.b";`);
    assert.deepStrictEqual(
      keysOf(`import type { Key } from "./keys"; declare const k: Key; t(k);`),
      ["m.a", "m.b"],
    );
  });

  it("gives up on combinations above the cap", () => {
    const members = Array.from({ length: 30 }, (_, i) => `"v${i}"`).join(" | ");
    const source = `type V = ${members}; declare const a: V; declare const b: V; t(\`\${a}.\${b}\`);`;
    assert.deepStrictEqual(kindsOf(source), ["unverifiable"]);
  });
});

describe("findMissingKeys", () => {
  const catalogs = {
    Desktop: flatten({ a: { b: "B" }, only: { desktop: "D" }, ctx_male: "m" }, "", new Set()),
    Mobile: flatten({ a: { b: "B" }, only: { mobile: "M" } }, "", new Set()),
  };

  it("reports keys absent from the apps consuming the file", () => {
    const dir = path.join(tmp, "pkg-both");
    const file = write("pkg-both/src/view.tsx", `t("a.b"); t("only.desktop"); t("nope");`);
    const consumers = new Map([[dir, new Set(["Desktop", "Mobile"])]]);
    const missing = findMissingKeys([file], catalogs, consumers);
    assert.deepStrictEqual(
      missing.map(m => [m.key, m.absentFrom]),
      [
        ["only.desktop", ["Mobile"]],
        ["nope", ["Desktop", "Mobile"]],
      ],
    );
  });

  it("only checks the consuming app of a single-app package", () => {
    const dir = path.join(tmp, "pkg-desktop");
    const file = write("pkg-desktop/src/view.tsx", `t("only.desktop");`);
    const consumers = new Map([[dir, new Set(["Desktop"])]]);
    assert.deepStrictEqual(findMissingKeys([file], catalogs, consumers), []);
  });

  it("filters by platform extension", () => {
    const dir = path.join(tmp, "pkg-platform");
    const web = write("pkg-platform/src/View.web.tsx", `t("only.desktop");`);
    const native = write("pkg-platform/src/View.native.tsx", `t("only.mobile");`);
    const wrongWeb = write("pkg-platform/src/Wrong.web.tsx", `t("only.mobile");`);
    const consumers = new Map([[dir, new Set(["Desktop", "Mobile"])]]);
    assert.deepStrictEqual(findMissingKeys([web, native], catalogs, consumers), []);
    assert.deepStrictEqual(
      findMissingKeys([wrongWeb], catalogs, consumers).map(m => m.absentFrom),
      [["Desktop"]],
    );
  });

  it("verifies every enumerated key", () => {
    const dir = path.join(tmp, "pkg-enum");
    const file = write("pkg-enum/src/view.tsx", `declare const p: "b" | "zzz"; t(\`a.\${p}\`);`);
    const consumers = new Map([[dir, new Set(["Desktop"])]]);
    assert.deepStrictEqual(
      findMissingKeys([file], catalogs, consumers).map(m => m.key),
      ["a.zzz"],
    );
  });

  it("accepts a context variant or the base key", () => {
    const dir = path.join(tmp, "pkg-ctx");
    const ok = write(
      "pkg-ctx/src/ok.tsx",
      `t("ctx", { context: "male" }); t("a.b", { context: "x" });`,
    );
    const bad = write("pkg-ctx/src/bad.tsx", `t("ctx", { context: "female" });`);
    const consumers = new Map([[dir, new Set(["Desktop"])]]);
    assert.deepStrictEqual(findMissingKeys([ok], catalogs, consumers), []);
    assert.deepStrictEqual(
      findMissingKeys([bad], catalogs, consumers).map(m => m.key),
      ["ctx"],
    );
  });
});

describe("hasKey", () => {
  const catalog = flatten(
    { a: { b: "B", count_one: "1", count_other: "n", half_one: "1" } },
    "",
    new Set(),
  );

  it("matches nested keys", () => assert.ok(hasKey(catalog, "a.b")));
  it("rejects unknown keys", () => assert.ok(!hasKey(catalog, "a.c")));
  it("rejects a plural-only key without count", () => assert.ok(!hasKey(catalog, "a.count")));
  it("accepts complete plural forms with count", () =>
    assert.ok(hasKey(catalog, "a.count", { plural: true })));
  it("rejects incomplete plural forms with count", () =>
    assert.ok(!hasKey(catalog, "a.half", { plural: true })));
});

describe("plural detection", () => {
  const plural = source => sitesOf(source).map(s => s.keys[0].plural);

  it("is set by a count option, a spread or a non-literal options object", () => {
    assert.deepStrictEqual(
      plural(`t("a", { count: 2 }); t("a", { ...o }); t("a", opts); t("a"); t("a", { x: 1 });`),
      [true, true, true, false, false],
    );
  });

  it("is set by the count attribute of Trans", () => {
    assert.deepStrictEqual(plural(`<Trans i18nKey="a" count={2} />; <Trans i18nKey="b" />;`), [
      true,
      false,
    ]);
  });
});

describe("findMissingKeys: namespaces", () => {
  const catalogs = {
    Desktop: flatten({ x: "X" }, "", new Set()),
    Mobile: flatten({ x: "X" }, "", new Set()),
  };

  it("resolves an explicit namespace only in the app whose default namespace it is", () => {
    const dir = path.join(tmp, "pkg-ns");
    const file = write(
      "pkg-ns/src/view.tsx",
      `t("common:x"); t("app:x"); const { t: t2 } = useTranslation("app"); t2("x"); t("x");`,
    );
    const consumers = new Map([[dir, new Set(["Desktop", "Mobile"])]]);
    assert.deepStrictEqual(
      findMissingKeys([file], catalogs, consumers).map(m => [m.line, m.key, m.absentFrom]),
      [
        [1, "common:x", ["Desktop"]],
        [1, "app:x", ["Mobile"]],
        [1, "app:x", ["Mobile"]],
      ],
    );
  });
});

describe("findMissingKeys: plurals", () => {
  const catalogs = {
    Desktop: flatten({ n_one: "1", n_other: "n", p: "P" }, "", new Set()),
  };

  it("requires the exact key without count and complete forms with count", () => {
    const dir = path.join(tmp, "pkg-plural");
    const file = write(
      "pkg-plural/src/view.tsx",
      `t("n"); t("n", { count: 2 }); t("p", { count: 2 });`,
    );
    const consumers = new Map([[dir, new Set(["Desktop"])]]);
    assert.deepStrictEqual(
      findMissingKeys([file], catalogs, consumers).map(m => m.line),
      [1],
    );
  });
});

describe("consumersOf", () => {
  const dirOf = name => path.join(path.resolve(__dirname, "../../.."), "features", name);
  const packages = new Map([
    ["@f/leaf", { name: "@f/leaf", dir: dirOf("leaf"), deps: [] }],
    [
      "@l/bridge",
      { name: "@l/bridge", dir: path.join(dirOf(".."), "libs", "bridge"), deps: ["@f/leaf"] },
    ],
    ["@f/alone", { name: "@f/alone", dir: dirOf("alone"), deps: [] }],
  ]);

  it("reaches a scanned package through a package outside the scanned layers", () => {
    const consumers = consumersOf(packages, { Mobile: ["@l/bridge"], Desktop: [] });
    assert.deepStrictEqual([...consumers.get(dirOf("leaf"))], ["Mobile"]);
    assert.deepStrictEqual([...consumers.get(dirOf("alone"))], []);
    assert.ok(!consumers.has(path.join(dirOf(".."), "libs", "bridge")));
  });
});
