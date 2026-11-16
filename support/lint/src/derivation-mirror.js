// Rationale: support/lint/README.md#derivation-mirrorin-step.

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// Loaded on the two mirrored files only, so every other lint run skips the TypeScript parser.
const require = createRequire(import.meta.url);
/** @type {typeof import("typescript")} */
let ts;

const LEGACY = "libs/ledger-wallet-framework/src/derivation.ts";
const MIRROR = "domain/entity/derivation/src/modes.internals.ts";

const MIRRORED_MODE_FIELDS = [
  "mandatoryEmptyAccountSkip",
  "isNonIterable",
  "startsAt",
  "overridesDerivation",
  "purpose",
  "isUnsplit",
  "skipFirst",
  "isInvalid",
];

const pickModeFields = modes =>
  Object.fromEntries(
    Object.entries(modes).map(([mode, spec]) => [
      mode,
      Object.fromEntries(MIRRORED_MODE_FIELDS.filter(f => f in spec).map(f => [f, spec[f]])),
    ]),
  );
const enabledKeys = table => Object.keys(table).filter(key => table[key] === true);
const identity = value => value;

/** Each mirrored table: its name on both sides, and how each side reads as the same value. */
const TABLES = [
  { legacy: "modes", mirror: "DERIVATION_MODES", fromLegacy: pickModeFields, fromMirror: identity },
  {
    legacy: "legacyDerivations",
    mirror: "LEGACY_MODES",
    fromLegacy: identity,
    fromMirror: identity,
  },
  {
    legacy: "disableBIP44",
    mirror: "WITHOUT_BIP44",
    fromLegacy: enabledKeys,
    fromMirror: identity,
  },
  {
    legacy: "mandatoryEmptyAccountSkipByCurrency",
    mirror: "MANDATORY_EMPTY_ACCOUNT_SKIP_BY_CURRENCY",
    fromLegacy: identity,
    fromMirror: identity,
  },
];

const isUnwrapped = node =>
  ts.isAsExpression(node) ||
  ts.isSatisfiesExpression(node) ||
  ts.isParenthesizedExpression(node) ||
  ts.isTypeAssertionExpression(node);

// Calls whose arguments are a list of ids; any other call reads as its first argument (`Object.freeze(x)`).
const LIST_CALLS = new Set(["currencies"]);

/** @param {ts.Node} node */
function evaluate(node) {
  if (isUnwrapped(node)) return evaluate(node.expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isArrayLiteralExpression(node)) return node.elements.map(evaluate);
  if (ts.isCallExpression(node)) {
    const isList = ts.isIdentifier(node.expression) && LIST_CALLS.has(node.expression.text);
    if (isList) return node.arguments.map(evaluate);
    if (node.arguments.length !== 1) throw new Error("not a literal table");
    return evaluate(node.arguments[0]);
  }
  if (ts.isObjectLiteralExpression(node)) {
    const entries = node.properties.map(property => {
      if (!ts.isPropertyAssignment(property)) throw new Error("not a literal table");
      const key = property.name;
      return [
        ts.isIdentifier(key) || ts.isStringLiteral(key) ? key.text : key.getText(),
        evaluate(property.initializer),
      ];
    });
    return Object.fromEntries(entries);
  }
  throw new Error(`not a literal table: ${ts.SyntaxKind[node.kind]}`);
}

/** The top-level `const` tables of a file, by name. */
function readTables(fileName, text) {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, true);
  const tables = new Map();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      try {
        tables.set(declaration.name.text, evaluate(declaration.initializer));
      } catch {
        // Not a literal: never a mirrored table.
      }
    }
  }
  return tables;
}

/** Arrays of ids are sets; the arrays of an object (mode lists) keep their order. */
const normalize = value =>
  Array.isArray(value) && value.every(item => typeof item === "string") ? [...value].sort() : value;

const stable = value =>
  JSON.stringify(value, (_key, inner) =>
    inner && typeof inner === "object" && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => a.localeCompare(b)))
      : inner,
  );

/** What differs, one line per key or id. */
function differences(legacy, mirror) {
  if (Array.isArray(legacy) && Array.isArray(mirror)) {
    const onlyLegacy = legacy.filter(id => !mirror.includes(id));
    const onlyMirror = mirror.filter(id => !legacy.includes(id));
    return [
      ...onlyLegacy.map(id => `${id}: only in derivation.ts`),
      ...onlyMirror.map(id => `${id}: only in the mirror`),
    ];
  }
  const keys = new Set([...Object.keys(legacy ?? {}), ...Object.keys(mirror ?? {})]);
  return [...keys]
    .filter(key => stable(legacy?.[key]) !== stable(mirror?.[key]))
    .map(
      key =>
        `${key}: ${stable(legacy?.[key]) ?? "missing"} in derivation.ts, ${stable(mirror?.[key]) ?? "missing"} in the mirror`,
    );
}

const message = (table, lines) =>
  `\`${table}\` drifted from its mirror (${lines.slice(0, 5).join("; ")}${lines.length > 5 ? "; …" : ""}). ` +
  `Change ${LEGACY} and ${MIRROR} together: see domain/entity/derivation/README.md.`;

const inStep = {
  create(context) {
    const filename = (context.physicalFilename ?? context.filename ?? "").split(path.sep).join("/");
    const side = filename.endsWith(LEGACY) ? "legacy" : filename.endsWith(MIRROR) ? "mirror" : null;
    if (!side) return {};
    ts ??= require("typescript");
    const root = filename.slice(0, -(side === "legacy" ? LEGACY : MIRROR).length);
    const otherFile = path.join(root, side === "legacy" ? MIRROR : LEGACY);
    let otherText;
    try {
      otherText = fs.readFileSync(otherFile, "utf8");
    } catch {
      return {};
    }
    const own = readTables(filename, context.sourceCode.text);
    const other = readTables(otherFile, otherText);
    const legacyTables = side === "legacy" ? own : other;
    const mirrorTables = side === "legacy" ? other : own;

    const drifts = new Map();
    for (const table of TABLES) {
      const ownName = table[side];
      if (!legacyTables.has(table.legacy) || !mirrorTables.has(table.mirror)) {
        drifts.set(ownName, [`${table.legacy} or ${table.mirror} is no longer a literal table`]);
        continue;
      }
      const lines = differences(
        normalize(table.fromLegacy(legacyTables.get(table.legacy))),
        normalize(table.fromMirror(mirrorTables.get(table.mirror))),
      );
      if (lines.length > 0) drifts.set(ownName, lines);
    }

    return {
      VariableDeclarator(node) {
        const name = node.id?.name;
        if (
          node.parent?.parent?.type !== "Program" &&
          node.parent?.parent?.type !== "ExportNamedDeclaration"
        )
          return;
        const lines = drifts.get(name);
        if (!lines) return;
        drifts.delete(name);
        context.report({ message: message(name, lines), node: node.id });
      },
      "Program:exit"(node) {
        for (const [name, lines] of drifts) context.report({ message: message(name, lines), node });
      },
    };
  },
};

export default {
  meta: { name: "derivation-mirror" },
  rules: { "in-step": inStep },
};
