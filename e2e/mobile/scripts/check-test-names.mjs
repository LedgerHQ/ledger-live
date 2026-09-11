#!/usr/bin/env node
/**
 * Fails if any test or describe title could differ between two runs of the same commit.
 *
 * A Detox retry re-runs only the tests that failed, and selects them by exact full name
 * (see jest.environment.ts). A title that changes between attempts cannot be matched, so the
 * test is silently left un-retried on its failed verdict — or, if it was the only failure in
 * its file, the retry aborts because nothing matched. Neither is visible in a green log, which
 * is why this is enforced rather than reviewed.
 *
 * Three things are rejected:
 *   1. a known non-deterministic call written straight into the title, e.g. `${Date.now()}`
 *   2. any other call made inside the interpolation itself, e.g. `${getRandomLiveApp()}`
 *   3. a title interpolating an in-file binding whose initializer calls a function, e.g.
 *        const liveApp = app.discover.getRandomLiveApp();
 *        it(`opens ${liveApp}`, ...)
 *
 * 2 and 3 are the same hazard reached two ways: a call runs at collection time, and every retry
 * attempt is a fresh process that runs it again, so nothing guarantees the same value twice.
 * Property access on fixtures and enums (`account.currency.testLabel`) is fine and is by far the
 * common case — of the 45 interpolations in the suite today, none is a call.
 *
 * Keep the value out of the name and log it from the test body instead. If a call really is
 * deterministic, put `// deterministic-title-ok` on the line above the declaration.
 */
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPT_OUT = "deterministic-title-ok";
const TITLE_CALLEES = new Set(["it", "test", "describe", "fit", "xit"]);
// Written into a title directly; the in-file binding rule below covers the indirect cases.
const NON_DETERMINISTIC = /\b(Math\.random|randomInt|Date\.now|new Date|uuid|nanoid|randomUUID)\b/;

const files = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== "artifacts") walk(full);
    } else if (/\.tsx?$/.test(entry.name)) {
      files.push(full);
    }
  }
})(ROOT);

/** Unwraps `(isSmokeTestRun ? it.skip : it)(...)` and `it.skip(...)` down to the base name. */
const calleeName = expr => {
  let node = expr;
  while (ts.isParenthesizedExpression(node)) node = node.expression;
  if (ts.isConditionalExpression(node)) {
    return calleeName(node.whenTrue) ?? calleeName(node.whenFalse);
  }
  if (ts.isPropertyAccessExpression(node)) return calleeName(node.expression);
  return ts.isIdentifier(node) ? node.text : null;
};

/** A call or `new` anywhere in the expression: evaluated per process, so not stable by construction. */
const containsCall = node => {
  let found = false;
  (function scan(n) {
    if (found) return;
    if (ts.isCallExpression(n) || ts.isNewExpression(n)) found = true;
    else ts.forEachChild(n, scan);
  })(node);
  return found;
};

const violations = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const rel = path.relative(ROOT, file);
  const lineOf = node => src.getLineAndCharacterOfPosition(node.getStart(src)).line + 1;
  const optedOut = node =>
    (text.slice(0, node.getStart(src)).split("\n").at(-2) ?? "").includes(OPT_OUT);

  // Bindings declared in this file whose initializer calls something, so their value is
  // produced at collection time rather than read from a fixture.
  const callBackedBindings = new Map();
  (function collect(node) {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      let hasCall = false;
      (function scan(n) {
        if (ts.isCallExpression(n)) hasCall = true;
        ts.forEachChild(n, scan);
      })(node.initializer);
      if (hasCall && !optedOut(node)) {
        callBackedBindings.set(node.name.text, {
          line: lineOf(node),
          init: node.initializer.getText(src).replace(/\s+/g, " ").slice(0, 60),
        });
      }
    }
    ts.forEachChild(node, collect);
  })(src);

  (function visit(node) {
    if (ts.isCallExpression(node) && node.arguments.length) {
      const name = calleeName(node.expression);
      const title = node.arguments[0];
      if (TITLE_CALLEES.has(name) && ts.isTemplateExpression(title) && !optedOut(title)) {
        for (const span of title.templateSpans) {
          const expr = span.expression.getText(src);
          if (NON_DETERMINISTIC.test(expr)) {
            violations.push({
              rel,
              line: lineOf(title),
              expr,
              why: "non-deterministic call in the title",
            });
            continue;
          }
          if (containsCall(span.expression)) {
            violations.push({
              rel,
              line: lineOf(title),
              expr,
              why: `interpolation calls a function ("${expr}"), which re-runs in every attempt's process`,
            });
            continue;
          }
          // Only a bare identifier can be traced back to a declaration here; a property chain
          // such as `account.currency.testLabel` reads a fixture and is stable by construction.
          const binding = ts.isIdentifier(span.expression) && callBackedBindings.get(expr);
          if (binding) {
            violations.push({
              rel,
              line: lineOf(title),
              expr,
              why: `interpolates "${expr}", assigned from a call at line ${binding.line}: ${binding.init}`,
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  })(src);
}

if (violations.length === 0) {
  console.log(`✅ ${files.length} files: every test title is stable across retries.`);
  process.exit(0);
}

console.error(`❌ ${violations.length} test title(s) may change between attempts:\n`);
for (const v of violations) {
  console.error(`  ${v.rel}:${v.line}`);
  console.error(`    ${v.why}`);
}
console.error(
  `\nA Detox retry matches tests by exact name, so these cannot be retried reliably.\n` +
    `Keep the value out of the title and log it from the test body, or mark a genuinely\n` +
    `deterministic declaration with "// ${OPT_OUT}" on the line above.`,
);
process.exit(1);
