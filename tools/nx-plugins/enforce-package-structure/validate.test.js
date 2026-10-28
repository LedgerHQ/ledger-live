"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  auditFileExceptions,
  auditIntermediateBarrelWaivers,
  checkPackage,
  findPackageRoots,
} = require("./validate");
const { COMPONENT_EXCEPTIONS, FILE_EXCEPTIONS, PACKAGE_EXCEPTIONS } = require("./exceptions");
const { INTERMEDIATE_BARREL_WAIVERS } = require("./intermediate-barrels");
const { CHAIN_BREAKS } = require("./rules");

const REPO_ROOT = path.resolve(__dirname, "../../..");

/**
 * @param {Record<string, string>} files paths relative to the workspace root
 * @returns {string} workspace root
 */
function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "package-structure-test-"));
  for (const [file, content] of Object.entries(files)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return root;
}

test("a clean package reports nothing", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
  });
  assert.deepEqual(checkPackage(root, "shared/thing"), []);
});

test("nested barrels are checked, at any depth", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./deep";\n',
    "shared/thing/src/deep/nested/index.ts": 'export { a } from "./a";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => [v.file, v.code]),
    [
      ["shared/thing/src/deep/nested/index.ts", "not-a-barrel"],
      ["shared/thing/src/deep/nested/index.ts", "orphan-barrel"],
    ],
  );
});

test("tests and non-index files are left alone", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/index.test.ts": 'import { a } from "./schema";\n',
    "shared/thing/src/schema.ts": 'import { z } from "zod";\nexport const a = z;\n',
  });
  assert.deepEqual(checkPackage(root, "shared/thing"), []);
});

test("a package marked `skip` is not checked at all", () => {
  const root = workspace({
    "shared/env/src/index.ts": 'import { z } from "zod";\nexport const broken = z;\n',
  });
  // shared/env carries a skip entry, so even a blatantly non-barrel index passes.
  assert.ok(PACKAGE_EXCEPTIONS["shared/env"]?.skip === true);
  assert.deepEqual(checkPackage(root, "shared/env"), []);
  // The same content anywhere else is still a violation.
  const other = workspace({
    "shared/thing/src/index.ts": 'import { z } from "zod";\nexport const broken = z;\n',
  });
  assert.equal(checkPackage(other, "shared/thing").length, 2);
});

test("every exception carries a reason and an exit condition", () => {
  for (const [root, exception] of Object.entries(PACKAGE_EXCEPTIONS)) {
    assert.ok(
      typeof exception.reason === "string" && exception.reason.length > 0,
      `${root} must document why it is excepted`,
    );
    assert.match(
      exception.reason,
      /exit condition/i,
      `${root} must state how the exception gets removed — entries are temporary`,
    );
  }
});

const ONE_PLATFORM_PACKAGE = {
  "shared/thing/package.json": JSON.stringify({
    exports: { ".": { "react-native": "./src/index.native.ts", default: "./src/index.ts" } },
  }),
  "shared/thing/src/index.ts": "export {};\n",
  "shared/thing/src/index.native.ts": 'export * from "./Sheet";\n',
  "shared/thing/src/Sheet.native.tsx": "export function Sheet() { return null; }\n",
};

test("component violations are reported next to barrel violations", () => {
  const found = checkPackage(workspace(ONE_PLATFORM_PACKAGE), "shared/thing", {});
  assert.deepEqual(
    found.map(v => [v.file, v.rule, v.code]),
    [
      ["shared/thing/src/index.ts", undefined, "not-a-barrel"],
      ["shared/thing/src/Sheet.native.tsx", "R1", "universal-parity"],
    ],
  );
});

test("a component waiver silences its rules only, and a stale one is reported", () => {
  const root = workspace(ONE_PLATFORM_PACKAGE);
  function codes(waivers) {
    return checkPackage(root, "shared/thing", { "shared/thing": waivers })
      .filter(v => v.rule)
      .map(v => `${v.rule} ${v.code} ${v.subject}`);
  }

  assert.deepEqual(codes({ Sheet: { rules: ["R1"] } }), []);
  assert.deepEqual(codes({ Sheet: { rules: ["R5"] } }), [
    "R1 universal-parity Sheet",
    "R5 stale-waiver Sheet",
  ]);
  assert.deepEqual(codes({ Sheet: { rules: ["R1"] }, Gone: { rules: ["R1"] } }), [
    "R1 stale-waiver Gone",
  ]);
});

test("every component waiver names a package, its rules and an exit condition", () => {
  for (const [root, waivers] of Object.entries(COMPONENT_EXCEPTIONS)) {
    assert.ok(
      fs.existsSync(path.join(REPO_ROOT, root, "package.json")),
      `${root} is not a package`,
    );
    for (const [subject, waiver] of Object.entries(waivers)) {
      assert.ok(waiver.rules.length > 0, `${root} ${subject} must name the rules it waives`);
      for (const rule of waiver.rules) assert.match(rule, /^R[1-5]$/);
      assert.match(waiver.reason, /exit condition/i, `${root} ${subject} needs an exit condition`);
    }
  }
});

test("findPackageRoots picks up the new-architecture layers only", () => {
  const root = workspace({
    "domain/entity/thing/package.json": "{}",
    "shared/other/package.json": "{}",
    "features/flow/x/package.json": "{}",
    "libs/legacy/package.json": "{}",
    "apps/desktop/package.json": "{}",
  });
  assert.deepEqual(findPackageRoots(root), [
    "domain/entity/thing",
    "features/flow/x",
    "shared/other",
  ]);
});

test("`export *` from a barrel is followed into the module it names", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./exports";\n',
    "shared/thing/src/exports.ts": 'export { a } from "./a";\n',
  });
  const found = checkPackage(root, "shared/thing");
  assert.deepEqual(
    found.map(v => [v.file, v.code]),
    [["shared/thing/src/exports.ts", "hidden-barrel"]],
  );
});

test("`export *` is followed through several modules", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./exports";\n',
    "shared/thing/src/exports.ts": 'export * from "./deeper";\nexport const ok = 1;\n',
    "shared/thing/src/deeper.ts": 'export { a } from "./a";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => [v.file, v.code]),
    [["shared/thing/src/deeper.ts", "hidden-barrel"]],
  );
});

test("a reached module proxying another workspace package fails", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./hooks";\n',
    "shared/thing/src/hooks.ts": 'export { useOther } from "@features/platform-other";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.code),
    ["cross-package-reexport"],
  );
});

test("a reached module holding only declarations passes", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": [
      'import { z } from "zod";',
      "export const Schema = z.object({});",
      "export type Thing = z.infer<typeof Schema>;",
    ].join("\n"),
  });
  assert.deepEqual(checkPackage(root, "shared/thing"), []);
});

test("platform variants and folder indexes are all followed", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./theme";\nexport * from "./hooks";\n',
    "shared/thing/src/theme.web.ts": 'export { a } from "./a";\n',
    "shared/thing/src/theme.native.ts": 'export { a } from "./a";\n',
    "shared/thing/src/hooks/index.ts": 'export * from "./useThing";\n',
    "shared/thing/src/hooks/useThing.tsx": 'export { b } from "./b";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.file),
    [
      "shared/thing/src/hooks/useThing.tsx",
      "shared/thing/src/theme.native.ts",
      "shared/thing/src/theme.web.ts",
    ],
  );
});

test("an `export *` cycle terminates and reports each file once", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./a";\n',
    "shared/thing/src/a.ts": 'export * from "./b";\nexport { x } from "./x";\n',
    "shared/thing/src/b.ts": 'export * from "./a";\nexport * from "./index";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.file),
    ["shared/thing/src/a.ts"],
  );
});

test("every source file in package.json#exports is checked, under any condition", () => {
  const root = workspace({
    "shared/thing/package.json": JSON.stringify({
      exports: {
        ".": { "react-native": "./src/index.native.ts", default: "./src/index.ts" },
        "./server": { types: "./src/server.ts", default: "./src/server.ts" },
        "./native": { "react-native": ["./src/native.ts"] },
        "./*": "./src/*.ts",
        "./package.json": "./package.json",
      },
    }),
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/index.native.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
    "shared/thing/src/server.ts": 'export { a as b } from "./schema";\n',
    "shared/thing/src/native.ts": 'export * from "./nativeOnly";\n',
    "shared/thing/src/nativeOnly.ts": 'export { c } from "./c";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => [v.file, v.code]),
    [
      ["shared/thing/src/nativeOnly.ts", "hidden-barrel"],
      ["shared/thing/src/server.ts", "hidden-barrel"],
    ],
  );
});

test("a test support entry is not checked, as in components.js", () => {
  const root = workspace({
    "shared/thing/package.json": JSON.stringify({
      exports: {
        ".": "./src/index.ts",
        "./testing/module-mock": "./src/testing/moduleMock.ts",
        "./mocks": { default: "./src/mocks.ts" },
      },
    }),
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
    "shared/thing/src/testing/moduleMock.ts": 'export { a as b } from "../schema";\n',
    "shared/thing/src/mocks.ts": 'export { a as c } from "./schema";\n',
  });
  assert.deepEqual(checkPackage(root, "shared/thing"), []);
});

test("a file exception hides that file's violations only", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./a";\nexport * from "./b";\n',
    "shared/thing/src/a.ts": 'export * from "./c";\nexport { x } from "./x";\n',
    "shared/thing/src/b.ts": 'export { y } from "./y";\n',
    "shared/thing/src/c.ts": 'export { z } from "./z";\n',
  });
  const fileExceptions = { "shared/thing/src/a.ts": "Exit condition: none needed in a test." };
  // The excepted file is still followed, so what it reaches stays checked.
  assert.deepEqual(
    checkPackage(root, "shared/thing", {}, fileExceptions).map(v => v.file),
    ["shared/thing/src/b.ts", "shared/thing/src/c.ts"],
  );
});

test("the file exception audit flags a missing file, a clean file and a missing exit condition", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./dirty";\nexport * from "./clean";\n',
    "shared/thing/src/dirty.ts": 'export { a } from "./a";\n',
    "shared/thing/src/clean.ts": "export const a = 1;\n",
  });
  const reason = "TEMPORARY. Exit condition: fix it.";
  assert.deepEqual(auditFileExceptions(root, { "shared/thing/src/dirty.ts": reason }), []);
  assert.deepEqual(auditFileExceptions(root, { "shared/thing/src/gone.ts": reason }), [
    "shared/thing/src/gone.ts: no such file",
  ]);
  assert.deepEqual(auditFileExceptions(root, { "shared/thing/src/clean.ts": reason }), [
    "shared/thing/src/clean.ts: no violation left to except, delete the entry",
  ]);
  assert.deepEqual(auditFileExceptions(root, { "shared/thing/src/dirty.ts": "Because." }), [
    "shared/thing/src/dirty.ts: the reason states no exit condition",
  ]);
});

test("every file exception names a file that still has a violation, and its exit condition", () => {
  assert.deepEqual(auditFileExceptions(REPO_ROOT, FILE_EXCEPTIONS), []);
});

test("an indented or same-line `export *` in a barrel is followed too", () => {
  const root = workspace({
    "shared/thing/src/index.ts":
      '  export * from "./a";\nexport * from "./b"; export * from "./c";\n',
    "shared/thing/src/a.ts": 'export { x } from "./x";\n',
    "shared/thing/src/b.ts": "export const ok = 1;\n",
    "shared/thing/src/c.ts": 'export { y } from "./y";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.file),
    ["shared/thing/src/a.ts", "shared/thing/src/c.ts"],
  );
});

test("`export *` below JSX in a reached component is still followed", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./View";\n',
    "shared/thing/src/View.tsx": [
      "export const View = () => (<p>Hello</p>);",
      'export * from "./deeper";',
    ].join("\n"),
    "shared/thing/src/deeper.ts": 'export { a } from "./a";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => [v.file, v.code]),
    [["shared/thing/src/deeper.ts", "hidden-barrel"]],
  );
});

test("an `.ios` file does not hide its `.android` sibling", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./theme";\n',
    "shared/thing/src/theme.ts": "export const theme = {};\n",
    "shared/thing/src/theme.ios.ts": 'export { a } from "./a";\n',
    "shared/thing/src/theme.android.ts": 'export { b } from "./b";\n',
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing").map(v => v.file),
    ["shared/thing/src/theme.android.ts", "shared/thing/src/theme.ios.ts"],
  );
});

/**
 * @param {Record<string, string>} files
 * @returns {string[][]} each barrel location violation, as [file, code]
 */
function barrelLocations(files) {
  return checkPackage(workspace(files), "shared/thing", {}, {}, {})
    .filter(v => v.code === "orphan-barrel" || v.code === "nested-barrel")
    .map(v => [v.file, v.code]);
}

test("the root barrel and its platform variants are allowed", () => {
  assert.deepEqual(
    barrelLocations({
      "shared/thing/src/index.ts": 'export * from "./schema";\n',
      "shared/thing/src/index.native.ts": 'export * from "./schema";\n',
      "shared/thing/src/index.web.tsx": 'export * from "./schema";\n',
      "shared/thing/src/schema.ts": "export const a = 1;\n",
    }),
    [],
  );
});

test("an exports target is an entry, so its own first-level barrels are allowed", () => {
  assert.deepEqual(
    barrelLocations({
      "shared/thing/package.json": JSON.stringify({
        exports: {
          ".": "./src/index.ts",
          "./state": {
            "react-native": "./src/state/index.native.ts",
            default: "./src/state/index.ts",
          },
        },
      }),
      "shared/thing/src/index.ts": 'export * from "./schema";\n',
      "shared/thing/src/schema.ts": "export const a = 1;\n",
      "shared/thing/src/state/index.ts": 'export * from "./slice";\n',
      "shared/thing/src/state/index.native.ts": 'export * from "./slice";\n',
      "shared/thing/src/state/slice/index.ts": 'export * from "./slice";\n',
      "shared/thing/src/state/slice/slice.ts": "export const slice = 1;\n",
    }),
    [],
  );
});

test("a barrel one `export *` level below an entry is allowed, even through a plain module", () => {
  assert.deepEqual(
    barrelLocations({
      "shared/thing/src/index.ts": 'export * from "./hooks";\nexport * from "./api";\n',
      "shared/thing/src/hooks/index.ts": 'export * from "./useThing";\n',
      "shared/thing/src/hooks/useThing.ts": "export const useThing = () => 1;\n",
      "shared/thing/src/api.ts": 'export * from "./client";\nexport const api = 1;\n',
      "shared/thing/src/client/index.ts": 'export * from "./client";\n',
      "shared/thing/src/client/client.ts": "export const client = 1;\n",
    }),
    [],
  );
});

test("a barrel in an internals location is allowed", () => {
  assert.deepEqual(
    barrelLocations({
      "shared/thing/src/index.ts": 'export * from "./schema";\n',
      "shared/thing/src/schema.ts":
        'import { helper } from "./internals";\nexport const a = helper;\n',
      "shared/thing/src/internals/index.ts": 'export * from "./helper";\n',
      "shared/thing/src/internals/helper.ts": "export const helper = 1;\n",
    }),
    [],
  );
});

test("a pure `export *` chain down the folders is allowed two levels deep, on every platform", () => {
  assert.deepEqual(
    barrelLocations({
      "shared/thing/src/index.ts": 'export * from "./services";\nexport const version = 1;\n',
      "shared/thing/src/services/index.ts": '// Each service.\nexport * from "./portfolio";\n',
      "shared/thing/src/services/portfolio/index.ts": 'export * from "./api";\n',
      "shared/thing/src/services/portfolio/index.native.ts": 'export * from "./api";\n',
      "shared/thing/src/services/portfolio/index.web.ts": 'export * from "./api";\n',
      "shared/thing/src/services/portfolio/api.ts": "export const api = 1;\n",
    }),
    [],
  );
});

test("a pure `export *` chain down the folders is allowed three levels deep, through variants", () => {
  assert.deepEqual(
    barrelLocations({
      "shared/thing/src/index.ts": 'export * from "./components";\n',
      "shared/thing/src/components/index.ts": 'export * from "./cards";\n',
      "shared/thing/src/components/index.native.ts": 'export * from "./cards";\n',
      "shared/thing/src/components/cards/index.ts": 'export * from "./Card";\n',
      "shared/thing/src/components/cards/Card/index.native.ts": 'export * from "./Card";\n',
      "shared/thing/src/components/cards/Card/index.web.ts": 'export * from "./Card";\n',
      "shared/thing/src/components/cards/Card/Card.ts": "export const Card = 1;\n",
    }),
    [],
  );
});

/**
 * @param {Record<string, string>} files
 * @returns {Array<[string, unknown]>} each nested barrel, as [file, the module that breaks its chain]
 */
function brokenChains(files) {
  return checkPackage(workspace(files), "shared/thing", {}, {}, {})
    .filter(v => v.code === "nested-barrel")
    .map(v => [v.file, v.breaker]);
}

test("a middle module that is not pure `export *` down its folder breaks the chain", () => {
  const card = {
    "shared/thing/src/index.ts": 'export * from "./components";\n',
    "shared/thing/src/components/Card/index.ts": 'export * from "./Card";\n',
    "shared/thing/src/components/Card/index.native.ts": 'export * from "./Card";\n',
    "shared/thing/src/components/Card/Card.ts": "export const Card = 1;\n",
    "shared/thing/src/components/Row.ts": "export const Row = 1;\n",
    "shared/thing/src/shared.ts": "export const shared = 1;\n",
  };
  const middle = "shared/thing/src/components/index.ts";
  for (const [statement, reason] of [
    ['export { Row } from "./Row";', CHAIN_BREAKS.named],
    ['export * as rows from "./Row";', CHAIN_BREAKS.namespace],
    ["export const Row = 1;", CHAIN_BREAKS.code],
    ['export * from "../shared";', CHAIN_BREAKS.outside],
  ]) {
    const breaker = { file: middle, line: 2, reason };
    assert.deepEqual(
      brokenChains({ ...card, [middle]: `export * from "./Card";\n${statement}\n` }),
      [
        ["shared/thing/src/components/Card/index.native.ts", breaker],
        ["shared/thing/src/components/Card/index.ts", breaker],
      ],
      statement,
    );
  }
});

test("a plain module is transparent: only the barrels of a chain can break it", () => {
  const files = {
    "shared/thing/src/index.ts": 'export * from "./api";\n',
    "shared/thing/src/api.ts": 'export * from "./client";\nexport const api = 1;\n',
    "shared/thing/src/client/index.ts": 'export * from "./http";\n',
    "shared/thing/src/client/http/index.ts": 'export * from "./http";\n',
    "shared/thing/src/client/http/http.ts": "export const http = 1;\n",
  };
  assert.deepEqual(brokenChains(files), []);
  assert.deepEqual(
    brokenChains({
      ...files,
      "shared/thing/src/client/index.ts": 'export * from "./http";\nexport const c = 1;\n',
    }),
    [
      [
        "shared/thing/src/client/http/index.ts",
        { file: "shared/thing/src/client/index.ts", line: 2, reason: CHAIN_BREAKS.code },
      ],
    ],
  );
});

test("a deep barrel that breaks its own chain names itself", () => {
  assert.deepEqual(
    brokenChains({
      "shared/thing/src/index.ts": 'export * from "./services";\n',
      "shared/thing/src/services/index.ts": 'export * from "./portfolio";\n',
      "shared/thing/src/services/portfolio/index.ts": 'export * from "../../shared";\n',
      "shared/thing/src/shared.ts": "export const shared = 1;\n",
    }),
    [
      [
        "shared/thing/src/services/portfolio/index.ts",
        {
          file: "shared/thing/src/services/portfolio/index.ts",
          line: 1,
          reason: CHAIN_BREAKS.outside,
        },
      ],
    ],
  );
});

test("a pure chain does not excuse another, broken chain to the same barrel", () => {
  assert.deepEqual(
    brokenChains({
      "shared/thing/src/index.ts": 'export * from "./services";\n',
      "shared/thing/src/services/index.ts": 'export * from "./portfolio";\n',
      "shared/thing/src/services/index.native.ts":
        'export * from "./portfolio";\nexport const native = 1;\n',
      "shared/thing/src/services/portfolio/index.ts": 'export * from "./api";\n',
      "shared/thing/src/services/portfolio/api.ts": "export const api = 1;\n",
    }),
    [
      [
        "shared/thing/src/services/portfolio/index.ts",
        { file: "shared/thing/src/services/index.native.ts", line: 2, reason: CHAIN_BREAKS.code },
      ],
    ],
  );
});

test("an entry reached from another entry counts from itself", () => {
  const files = {
    "shared/thing/src/index.ts": 'export * from "./legacy";\n',
    // A named export breaks the chain, so only the `./legacy` entry allows `store/index.ts`.
    "shared/thing/src/legacy/index.ts": 'export * from "./store";\nexport { a } from "./a";\n',
    "shared/thing/src/legacy/a.ts": "export const a = 1;\n",
    "shared/thing/src/legacy/store/index.ts": 'export * from "./slice";\n',
    "shared/thing/src/legacy/store/slice.ts": "export const slice = 1;\n",
  };
  const manifest = exports => ({ "shared/thing/package.json": JSON.stringify({ exports }) });
  // Two levels below the root, but one below the `./legacy` entry.
  assert.deepEqual(
    barrelLocations({
      ...files,
      ...manifest({ ".": "./src/index.ts", "./legacy": "./src/legacy/index.ts" }),
    }),
    [],
  );
  assert.deepEqual(barrelLocations({ ...files, ...manifest({ ".": "./src/index.ts" }) }), [
    ["shared/thing/src/legacy/store/index.ts", "nested-barrel"],
  ]);
});

test("a barrel only its own package imports is an orphan, on every platform", () => {
  assert.deepEqual(
    barrelLocations({
      "shared/thing/src/index.ts": 'export * from "./view";\n',
      "shared/thing/src/view.ts": 'import { Row } from "./Row";\nexport const view = Row;\n',
      "shared/thing/src/Row/index.native.ts": 'export * from "./Row";\n',
      "shared/thing/src/Row/index.web.ts": 'export * from "./Row";\n',
      "shared/thing/src/Row/Row.ts": "export const Row = 1;\n",
    }),
    [
      ["shared/thing/src/Row/index.native.ts", "orphan-barrel"],
      ["shared/thing/src/Row/index.web.ts", "orphan-barrel"],
    ],
  );
});

test("an orphan `index.tsx` holding code is reported for both rules", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
    "shared/thing/src/Card/index.tsx": "export const Card = () => <div />;\n",
  });
  assert.deepEqual(
    checkPackage(root, "shared/thing", {}, {}, {}).map(v => [v.file, v.code]),
    [
      ["shared/thing/src/Card/index.tsx", "not-a-barrel"],
      ["shared/thing/src/Card/index.tsx", "orphan-barrel"],
    ],
  );
});

test("a barrel whose entry is dropped becomes an orphan", () => {
  const files = {
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
    "shared/thing/src/testing/index.ts": 'export * from "./render";\n',
    "shared/thing/src/testing/render.ts": "export const render = () => null;\n",
  };
  const withEntry = {
    ...files,
    "shared/thing/package.json": JSON.stringify({
      exports: { ".": "./src/index.ts", "./testing": "./src/testing/index.ts" },
    }),
  };
  const withoutEntry = {
    ...files,
    "shared/thing/package.json": JSON.stringify({ exports: { ".": "./src/index.ts" } }),
  };
  assert.deepEqual(barrelLocations(withEntry), []);
  assert.deepEqual(barrelLocations(withoutEntry), [
    ["shared/thing/src/testing/index.ts", "orphan-barrel"],
  ]);
});

test("a package marked `skip` has no barrel location violation either", () => {
  const root = workspace({
    "shared/env/src/index.ts": 'export * from "./schema";\n',
    "shared/env/src/schema.ts": "export const a = 1;\n",
    "shared/env/src/deep/index.ts": 'export * from "./value";\n',
    "shared/env/src/deep/value.ts": "export const value = 1;\n",
  });
  assert.deepEqual(checkPackage(root, "shared/env", {}, {}, {}), []);
});

test("an intermediate barrel waiver hides that file only", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
    "shared/thing/src/a/index.ts": 'export * from "./x";\n',
    "shared/thing/src/a/x.ts": "export const x = 1;\n",
    "shared/thing/src/b/index.ts": 'export * from "./y";\n',
    "shared/thing/src/b/y.ts": "export const y = 1;\n",
  });
  const waivers = { "shared/thing/src/a/index.ts": "Exit condition: none needed in a test." };
  assert.deepEqual(
    checkPackage(root, "shared/thing", {}, {}, waivers).map(v => v.file),
    ["shared/thing/src/b/index.ts"],
  );
});

test("the waiver audit flags a missing file, an allowed barrel and a missing exit condition", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./value";\n',
    "shared/thing/src/value.ts": 'export { a } from "./a";\n',
    "shared/thing/src/deep/index.ts": 'export * from "./value";\n',
    "shared/thing/src/deep/value.ts": "export const b = 1;\n",
  });
  const reason = "TEMPORARY. Exit condition: fix it.";
  assert.deepEqual(
    auditIntermediateBarrelWaivers(root, { "shared/thing/src/deep/index.ts": reason }),
    [],
  );
  assert.deepEqual(
    auditIntermediateBarrelWaivers(root, { "shared/thing/src/gone/index.ts": reason }),
    ["shared/thing/src/gone/index.ts: no such file"],
  );
  // The root barrel is allowed, and value.ts has a violation of another rule only.
  assert.deepEqual(
    auditIntermediateBarrelWaivers(root, {
      "shared/thing/src/index.ts": reason,
      "shared/thing/src/value.ts": reason,
    }),
    [
      "shared/thing/src/index.ts: no violation left to except, delete the entry",
      "shared/thing/src/value.ts: no violation left to except, delete the entry",
    ],
  );
  assert.deepEqual(
    auditIntermediateBarrelWaivers(root, { "shared/thing/src/deep/index.ts": "Because." }),
    ["shared/thing/src/deep/index.ts: the reason states no exit condition"],
  );
});

test("the file exception audit ignores barrel location violations", () => {
  const root = workspace({
    "shared/thing/src/index.ts": 'export * from "./schema";\n',
    "shared/thing/src/schema.ts": "export const a = 1;\n",
    "shared/thing/src/deep/index.ts": 'export * from "./value";\n',
    "shared/thing/src/deep/value.ts": "export const b = 1;\n",
  });
  assert.deepEqual(
    auditFileExceptions(root, { "shared/thing/src/deep/index.ts": "Exit condition: fix it." }),
    ["shared/thing/src/deep/index.ts: no violation left to except, delete the entry"],
  );
});

test("every intermediate barrel waiver names a file that is still reported", () => {
  assert.deepEqual(auditIntermediateBarrelWaivers(REPO_ROOT, INTERMEDIATE_BARREL_WAIVERS), []);
});
