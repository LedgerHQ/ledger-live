const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { extractKeys, findMissingKeys, flatten, hasKey } = require("./validate");

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
      import { translate } from "./i18n";
      const { t: tr } = useTranslation();
      i18n.t("a"); translate("b"); tr("c"); props.i18n.t("d");
    `;
    assert.deepStrictEqual(keysOf(source), ["a", "b", "c", "d"]);
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

  it("strips the namespace prefix", () => {
    assert.deepStrictEqual(keysOf(`t("common:a.b");`), ["a.b"]);
  });

  it("collects literal and enumerated context", () => {
    const [site] = sitesOf(`t("a", { context: "male" }); `);
    assert.deepStrictEqual(site.keys, [{ key: "a", contexts: ["male"] }]);
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
  const catalog = flatten({ a: { b: "B", count_one: "1", count_other: "n" } }, "", new Set());

  it("matches nested keys", () => assert.ok(hasKey(catalog, "a.b")));
  it("matches plural forms by base key", () => assert.ok(hasKey(catalog, "a.count")));
  it("rejects unknown keys", () => assert.ok(!hasKey(catalog, "a.c")));
});
