import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import plugin, { SELECTORS_IN_SLICE_RULE, sliceSelectorsWaivers } from "./redux-slices.js";

const OXLINT = fileURLToPath(new URL("../node_modules/.bin/oxlint", import.meta.url));
const RULE = "redux-slices/selectors-in-slice";

const SLICE = `
import { createSlice } from "@reduxjs/toolkit";
export const itemsSlice = createSlice({ name: "items", initialState: { list: [] }, reducers: {} });
`;

/**
 * Lints `files` with the rule on, the package `pkg/` declaring a slice unless `files` says
 * otherwise.
 *
 * @param {Record<string, string>} files paths relative to the fixture root
 * @param {Record<string, unknown>} [config] extra `.oxlintrc.json` fields
 * @returns {string[]} the `file:line` of each report, sorted
 */
function lint(files, config = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "redux-slices-test-"));
  const all = {
    ".oxlintrc.json": JSON.stringify({
      plugins: ["typescript"],
      jsPlugins: [fileURLToPath(new URL("./redux-slices.js", import.meta.url))],
      rules: { [RULE]: "error" },
      ...config,
    }),
    "pkg/package.json": "{}",
    "pkg/src/slice.ts": SLICE,
    ...files,
  };
  for (const [file, content] of Object.entries(all)) {
    const full = path.join(root, file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }

  const { status, stdout, stderr } = spawnSync(OXLINT, ["--format", "unix", "."], {
    cwd: root,
    encoding: "utf8",
  });
  // 0 is a clean run and 1 a run with reports; anything else means the lint itself failed.
  assert.ok(status === 0 || status === 1, `oxlint exited ${status}: ${stderr}${stdout}`);
  const diagnostics = stdout.split("\n").filter(line => /^[^:\s][^:]*:\d+:\d+:/.test(line));
  return diagnostics
    .map(line => {
      assert.ok(
        line.includes("redux-slices(selectors-in-slice)"),
        `unexpected diagnostic: ${line}`,
      );
      assert.ok(line.includes(SELECTORS_IN_SLICE_RULE), line);
      return line.split(":").slice(0, 2).join(":");
    })
    .sort();
}

/**
 * @param {string} source
 * @returns {string[]} the lines of `pkg/src/selectors.ts` that are reported
 */
function reportedLines(source) {
  return lint({ "pkg/src/selectors.ts": source }).map(at => at.split(":")[1]);
}

test("reports a function declaration that reads one root key", () => {
  assert.deepEqual(
    reportedLines(`type Root = { items: { list: string[] } };
export function selectItems(state: Root) {
  return state.items.list;
}
`),
    ["2"],
  );
});

test("reports const arrow and function expressions, by select* and *Selector names", () => {
  assert.deepEqual(
    reportedLines(`type Root = { items: { list: string[] } };
export const selectItems = (state: Root) => state.items.list;
export const itemsSelector = function (state: Root) { return state["items"]; };
export const countSelector = (state: Root) => state.items!.list.length;
`),
    ["2", "3", "4"],
  );
});

test("reports a selector whose state only feeds one other selector", () => {
  assert.deepEqual(
    reportedLines(`type Root = { items: { list: string[] } };
declare function selectItems(state: Root): string[];
export const selectFirst = (state: Root, index: number) => selectItems(state)[index];
`),
    ["3"],
  );
});

test("reports a selector that destructures one key of its state", () => {
  assert.deepEqual(
    reportedLines(`type Root = { items: { list: string[] } };
export const selectItems = ({ items }: Root) => items.list;
`),
    ["2"],
  );
});

test("does not report a function whose name is not a selector name", () => {
  assert.deepEqual(
    reportedLines(`type Root = { items: { list: string[] } };
export const getItems = (state: Root) => state.items.list;
export const selection = (state: Root) => state.items.list;
`),
    [],
  );
});

test("does not report a generic selector", () => {
  assert.deepEqual(
    reportedLines(`type Root = { items: Record<string, unknown> };
export function selectItem<K extends string>(state: Root, key: K) {
  return state.items[key];
}
export const selectOther = <K extends string>(state: Root, key: K) => state.items[key];
`),
    [],
  );
});

test("does not report a selector that reads two root keys or two selectors", () => {
  assert.deepEqual(
    reportedLines(`type Root = { items: string[]; filter: string };
declare function selectItems(state: Root): string[];
declare function selectFilter(state: Root): string;
export const selectVisible = (state: Root) => state.items.filter(item => item === state.filter);
export const selectMatches = (state: Root) => selectItems(state).filter(i => i === selectFilter(state));
export const selectMixed = (state: Root) => selectItems(state).length + state.filter.length;
`),
    [],
  );
});

test("does not report a selector that calls same-named selectors of two slices", () => {
  assert.deepEqual(
    reportedLines(`type Root = { contacts: string[]; accounts: string[] };
declare const contactsSlice: { selectors: { selectById(state: Root): string } };
declare const accountsSlice: { selectors: { selectById(state: Root): string } };
export const selectPair = (state: Root) =>
  contactsSlice.selectors.selectById(state) + accountsSlice.selectors.selectById(state);
export const selectContact = (state: Root) => contactsSlice.selectors.selectById(state);
`),
    ["6"],
  );
});

test("does not report a selector that takes two state parameters", () => {
  assert.deepEqual(
    reportedLines(`type NamesState = Map<string, string>;
type AccountsState = { byId: Record<string, { legacyId: string }> };
declare function selectAccountEntry(state: unknown, id: string): { legacyId: string } | undefined;
export const selectNameByUUID = (names: NamesState, accounts: AccountsState, id: string) =>
  names.get(id) ?? accounts.byId;
export const selectNameThrough = (names: Map<string, string>, accounts: unknown, id: string) => {
  const legacyId = selectAccountEntry(accounts, id)?.legacyId;
  return legacyId && names.get(legacyId);
};
`),
    [],
  );
});

test("does not report a selector whose state escapes as a whole", () => {
  assert.deepEqual(
    reportedLines(`type Root = { items: string[] };
declare function compute(state: Root): number;
export const selectAll = (state: Root) => state;
export const selectComputed = (state: Root) => compute(state);
export const selectDynamic = (state: Root, key: "items") => state[key];
`),
    [],
  );
});

test("does not report a selector already nested in createSlice selectors", () => {
  assert.deepEqual(
    reportedLines(`import { createSlice } from "@reduxjs/toolkit";
export const listSlice = createSlice({
  name: "list",
  initialState: { items: [] as string[] },
  reducers: {},
  selectors: {
    selectItems: state => state.items,
    selectFirst(state) {
      const selectHead = (s: { items: string[] }) => s.items[0];
      return selectHead(state);
    },
  },
});
export const { selectItems, selectFirst } = listSlice.selectors;
`),
    [],
  );
});

test("does not report in a package that declares no slice", () => {
  assert.deepEqual(
    lint({
      "pkg/src/slice.ts": "export const notASlice = 1;\n",
      "pkg/src/selectors.ts":
        "export const selectItems = (state: { items: string[] }) => state.items;\n",
    }),
    [],
  );
});

test("does not count a createSlice call written in a comment", () => {
  assert.deepEqual(
    lint({
      "pkg/src/slice.ts":
        '// Consider createSlice(...) later\n/* or createSlice<State>() */\nexport const url = "https://x"; // createSlice(\n',
      "pkg/src/selectors.ts":
        "export const selectItems = (state: { items: string[] }) => state.items;\n",
    }),
    [],
  );
});

test("finds the slice anywhere in the package src/, but not in its tests", () => {
  assert.deepEqual(
    lint({
      "pkg/src/slice.ts": "export const notASlice = 1;\n",
      "pkg/src/slice.test.ts": SLICE,
      "pkg/src/selectors.ts":
        "export const selectItems = (state: { items: string[] }) => state.items;\n",
      "other/package.json": "{}",
      "other/src/state/deep/slice.ts": SLICE,
      "other/src/selectors.ts":
        "export const selectItems = (state: { items: string[] }) => state.items;\n",
    }),
    ["other/src/selectors.ts:1"],
  );
});

test("does not report in a test file", () => {
  const selector = "export const selectItems = (state: { items: string[] }) => state.items;\n";
  assert.deepEqual(
    lint({
      "pkg/src/selectors.test.ts": selector,
      "pkg/src/__tests__/helpers.ts": selector,
      "pkg/src/selectors.spec.tsx": selector,
    }),
    [],
  );
});

test("is silenced by an oxlint-disable-next-line comment", () => {
  assert.deepEqual(
    reportedLines(`// oxlint-disable-next-line redux-slices/selectors-in-slice
export const selectItems = (state: { items: string[] }) => state.items;
`),
    [],
  );
});

test("offers no autofix", () => {
  assert.equal(plugin.rules["selectors-in-slice"].meta?.fixable, undefined);
});

test("registers the rule under the plugin name oxlint expects", () => {
  assert.equal(plugin.meta.name, "redux-slices");
  assert.ok(plugin.rules["selectors-in-slice"]);
});

test("waives repo-relative package directories below their layer config", () => {
  assert.deepEqual(
    sliceSelectorsWaivers([
      "domain/entity/contact",
      "shared/feature-flags",
      "features/flow/pay-balance",
      "features/platform/app-lock",
    ]),
    {
      files: [
        "entity/contact/src/**",
        "feature-flags/src/**",
        "pay-balance/src/**",
        "app-lock/src/**",
      ],
      rules: { [RULE]: "off" },
    },
  );
  assert.throws(() => sliceSelectorsWaivers(["libs/ledger-live-common"]), /not a package/);
});

test("a waiver turns the rule off for its package only", () => {
  // The fixture root stands for the domain/ layer config.
  const selector = "export const selectItems = (state: { items: string[] }) => state.items;\n";
  assert.deepEqual(
    lint(
      {
        "pkg/src/selectors.ts": selector,
        "other/package.json": "{}",
        "other/src/slice.ts": SLICE,
        "other/src/selectors.ts": selector,
      },
      { overrides: [sliceSelectorsWaivers(["domain/pkg"])] },
    ),
    ["other/src/selectors.ts:1"],
  );
});
