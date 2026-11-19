import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, describe, test } from "node:test";

import { estimatePlaywrightTestCount } from "./resolve.mjs";

const tempRoots = [];
after(() => {
  for (const root of tempRoots) fs.rmSync(root, { recursive: true, force: true });
});

function specTree(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-filter-count-"));
  tempRoots.push(root);
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(root, name);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, content);
  }
  return root;
}

function countFor(input, files) {
  return estimatePlaywrightTestCount({ input, checkDir: specTree(files) });
}

const suite = body => `test.describe("@alpha suite", () => {\n${body}\n});\n`;
const literalTest = title => `  test("${title}", async () => {});`;

describe("estimatePlaywrightTestCount counts test() calls", () => {
  test("one literal test counts 1", () => {
    assert.equal(countFor("@alpha", { "a.spec.ts": suite(literalTest("one")) }), 1);
  });

  test("a space before the parenthesis still counts", () => {
    const body = `${literalTest("one")}\n  test ("two", async () => {});`;
    assert.equal(countFor("@alpha", { "a.spec.ts": suite(body) }), 2);
  });

  test("sums the selected specs only", () => {
    const files = {
      "a.spec.ts": suite(`${literalTest("one")}\n${literalTest("two")}`),
      "b.spec.ts": `test.describe("@beta suite", () => {\n${literalTest("three")}\n});\n`,
    };
    assert.equal(countFor("@alpha", files), 2);
  });

  test("a regex .test() call does not count", () => {
    const body = `${literalTest("one")}\n  const isSwap = /swap/.test(process.env.NAME ?? "");`;
    assert.equal(countFor("@alpha", { "a.spec.ts": suite(body) }), 1);
  });

  test("commented-out tests do not count", () => {
    const body = [
      literalTest("one"),
      `  // test("line comment", async () => {});`,
      `  /* test("block comment", async () => {}); */`,
    ].join("\n");
    assert.equal(countFor("@alpha", { "a.spec.ts": suite(body) }), 1);
  });
});

describe("estimatePlaywrightTestCount gives null when a spec may run more tests", () => {
  const cases = {
    "a template title with ${}": "  test(`send ${currency}`, async () => {});",
    "a variable title": "  test(title, async () => {});",
    "a for loop": `  for (const x of xs) {\n${literalTest("loop")}\n  }`,
    "a while loop": `  while (more()) {\n${literalTest("loop")}\n  }`,
    forEach: `  xs.forEach(x => {\n${literalTest("loop")}\n  });`,
    map: `  xs.map(x => {\n${literalTest("loop")}\n  });`,
    flatMap: `  xs.flatMap(x => {\n${literalTest("loop")}\n  });`,
    reduce: `  xs.reduce((acc, x) => {\n${literalTest("loop")}\n  }, 0);`,
    "Array.from": `  Array.from({ length: 2 }, () => {\n${literalTest("loop")}\n  });`,
    "forEach with a space": `  xs.forEach (x => {\n${literalTest("loop")}\n  });`,
    "map with a space": `  xs.map (x => {\n${literalTest("loop")}\n  });`,
    "flatMap with a space": `  xs.flatMap (x => {\n${literalTest("loop")}\n  });`,
    "reduce with a space": `  xs.reduce ((acc, x) => {\n${literalTest("loop")}\n  }, 0);`,
    "Array.from with a space": `  Array.from ({ length: 2 }, () => {\n${literalTest("loop")}\n  });`,
    "a chained forEach on its own line": `  xs\n    .forEach(x => {\n${literalTest("loop")}\n  });`,
    "a named function": `  function register() {\n${literalTest("inner")}\n  }`,
    "an arrow helper": `  const register = () => {\n${literalTest("inner")}\n  };`,
    "an async arrow helper": `  const register = async x => {\n${literalTest("inner")}\n  };`,
  };
  for (const [label, body] of Object.entries(cases)) {
    test(label, () => {
      assert.equal(
        countFor("@alpha", { "a.spec.ts": suite(`${literalTest("one")}\n${body}`) }),
        null,
      );
    });
  }

  test("test imported as base", () => {
    const spec = `import { test as base } from "./fixtures";\nconst test = base.extend({});\n${suite(literalTest("one"))}`;
    assert.equal(countFor("@alpha", { "a.spec.ts": spec }), null);
  });

  test("test assigned to another name", () => {
    const spec = `const t = test;\n${suite(literalTest("one"))}`;
    assert.equal(countFor("@alpha", { "a.spec.ts": spec }), null);
  });

  test("an imported helper declares tests", () => {
    const files = {
      "a.spec.ts": `import { registerSendTests } from "./helper";\n${suite(literalTest("one"))}`,
      "helper.ts": `export const registerSendTests = () => {};\ntest("from helper", async () => {});\n`,
    };
    assert.equal(countFor("@alpha", files), null);
  });

  test("no test() call at all", () => {
    assert.equal(
      countFor("@alpha", { "a.spec.ts": `test.describe("@alpha suite", () => {});\n` }),
      null,
    );
  });
});

describe("estimatePlaywrightTestCount selects specs through the filter", () => {
  test("a tag kept only in an imported module still selects the spec", () => {
    const files = {
      "a.spec.ts": `import { TAG } from "./tags";\ntest.describe(TAG, () => {\n${literalTest("one")}\n});\n`,
      "tags.ts": `export const TAG = "@onlyInHelper";\n`,
      "b.spec.ts": `test.describe("@other", () => {\n${literalTest("two")}\n});\n`,
    };
    assert.equal(countFor("@onlyInHelper", files), 1);
  });

  test("an alternative that no spec mentions gives null", () => {
    const files = {
      "a.spec.ts": `test.describe("operationsList", () => {\n${literalTest("one")}\n});\n`,
    };
    assert.equal(countFor("operationsList", files), 1);
    assert.equal(countFor(String.raw`operationsList|USDT\s\(Tron\)`, files), null);
  });

  test("a grouped regex gives null", () => {
    const files = {
      "a.spec.ts": `test.describe("@alpha", () => {\n${literalTest("one")}\n});\n`,
      "b.spec.ts": `test.describe("@beta", () => {\n${literalTest("two")}\n});\n`,
    };
    assert.equal(countFor("@alpha|@beta", files), 2);
    assert.equal(countFor("(@alpha|@beta)", files), null);
  });
});
