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

function countFor(input, files, options = {}) {
  return estimatePlaywrightTestCount({ input, checkDir: specTree(files), ...options });
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

  test("test.only, skip, fixme and fail with a literal title count", () => {
    const body = ["only", "skip", "fixme", "fail"]
      .map(modifier => `  test.${modifier}("${modifier}", async () => {});`)
      .join("\n");
    assert.equal(countFor("@alpha", { "a.spec.ts": suite(body) }), 4);
  });

  test("comment markers inside strings do not hide code", () => {
    const body = [
      `  const pattern = "specs/*.json";`,
      literalTest("one"),
      `  /** doc */`,
      literalTest("two"),
    ].join("\n");
    assert.equal(countFor("@alpha", { "a.spec.ts": suite(body) }), 2);
  });

  test("an if block inside a test still counts", () => {
    const body = `  test("one", async () => {\n    if (ready) {\n      await go();\n    }\n  });`;
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
    "a for await loop": `  for await (const x of xs) {\n${literalTest("loop")}\n  }`,
    filter: `  xs.filter(x => {\n${literalTest("loop")}\n  });`,
    some: `  xs.some(x => {\n${literalTest("loop")}\n  });`,
    every: `  xs.every(x => {\n${literalTest("loop")}\n  });`,
    find: `  xs.find(x => {\n${literalTest("loop")}\n  });`,
    findLastIndex: `  xs.findLastIndex(x => {\n${literalTest("loop")}\n  });`,
    reduceRight: `  xs.reduceRight((acc, x) => {\n${literalTest("loop")}\n  }, 0);`,
    "a loop after a URL on the same line": `  const url = "https://x"; xs.forEach(x => {\n${literalTest("loop")}\n  });`,
    "a loop after a string that opens a fake comment": `  const glob = "specs/*.json";\n  xs.forEach(x => {\n${literalTest("loop")}\n  });\n  /** doc */`,
    "a named function": `  function register() {\n${literalTest("inner")}\n  }`,
    "a generator function": `  function* register() {\n${literalTest("inner")}\n  }`,
    "an arrow helper": `  const register = () => {\n${literalTest("inner")}\n  };`,
    "an async arrow helper": `  const register = async x => {\n${literalTest("inner")}\n  };`,
    "an arrow helper with a return type": `  const register = (name: string): void => {\n${literalTest("inner")}\n  };`,
    "a generic arrow helper": `  const register = <T,>(x: T) => {\n${literalTest("inner")}\n  };`,
    "a typed variable arrow helper": `  const register: Register = () => {\n${literalTest("inner")}\n  };`,
    "an arrow helper with a default call": `  const register = (x = pick()) => {\n${literalTest("inner")}\n  };`,
    "an object method": `  const helpers = {\n    register() {\n${literalTest("inner")}\n    },\n  };`,
    "an object arrow property": `  const helpers = {\n    register: () => {\n${literalTest("inner")}\n    },\n  };`,
    "a class method": `  class Helpers {\n    static register(name: string): void {\n${literalTest("inner")}\n    }\n  }`,
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

  test("test extended into another name", () => {
    const spec = `const it = test.extend({});\n${suite(literalTest("one"))}\nit("two", async () => {});\n`;
    assert.equal(countFor("@alpha", { "a.spec.ts": spec }), null);
  });

  test("an inverted filter", () => {
    const files = { "a.spec.ts": suite(literalTest("one")) };
    assert.equal(countFor("@alpha", files), 1);
    assert.equal(countFor("@alpha", files, { invertFilter: true }), null);
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

  test("smoke tests are added to the filter as an alternative", () => {
    const files = {
      "a.spec.ts": `test.describe("@alpha", () => {\n${literalTest("one")}\n});\n`,
      "b.spec.ts": `test.describe("@smoke", () => {\n${literalTest("two")}\n});\n`,
      "c.spec.ts": `test.describe("@other", () => {\n${literalTest("three")}\n});\n`,
    };
    assert.equal(countFor("@alpha", files), 1);
    assert.equal(countFor("@alpha", files, { smokeTests: true }), 2);
  });

  test("a team keeps only the specs it owns, ANDed with the filter and smoke", () => {
    const owned = body => `test.describe("@alpha", () => {\n  ownedBy(Team.BST);\n${body}\n});\n`;
    const files = {
      "a.spec.ts": owned(literalTest("one")),
      "b.spec.ts": owned(`  test("@smoke two", async () => {});`),
      "c.spec.ts": `test.describe("@alpha", () => {\n  ownedBy(Team.EARN);\n${literalTest("three")}\n});\n`,
    };
    assert.equal(countFor("@alpha", files, { team: "bst" }), 2);
    assert.equal(countFor("@alpha", files, { team: "bst", smokeTests: true }), 1);
  });
});
