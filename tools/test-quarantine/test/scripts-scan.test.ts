import test from "node:test";
import assert from "node:assert/strict";
import { classifyScript } from "../src/scripts-scan.ts";

test("bypass: a bare jest runner invokes jest directly", () => {
  const c = classifyScript("coverage", "jest --coverage");
  assert.equal(c.kind, "bypass");
  assert.equal(c.kind === "bypass" && /invokes jest directly/.test(c.reason), true);
});

test("bypass: jest behind env/prefix tokens still counts as the runner", () => {
  assert.equal(
    classifyScript("test:jest", "NODE_OPTIONS=--max-old-space-size=8192 jest").kind,
    "bypass",
  );
  assert.equal(classifyScript("test", "cross-env TZ=UTC jest --ci").kind, "bypass");
  assert.equal(
    classifyScript("coverage", "env-cmd -f .ci.unit.env pnpm jest --coverage --ci").kind,
    "bypass",
  );
  assert.equal(classifyScript("test", "pnpm jest --runTestsByPath src/*.test.ts").kind, "bypass");
});

test("bypass: a jest runner chained with another command", () => {
  const c = classifyScript(
    "ci-test-unit",
    "env-cmd -f .ci.unit.env pnpm jest --ci --updateSnapshot && git diff --exit-code src",
  );
  assert.equal(c.kind, "bypass");
  assert.equal(c.kind === "bypass" && /chained/.test(c.reason), true);
});

test("ok: a script name not in the allowlist", () => {
  assert.equal(classifyScript("test:jest:watch", "pnpm test:jest --watch").kind, "ok");
});

test("ok: oxfmt … jest (jest is a path arg, not the runner)", () => {
  assert.equal(classifyScript("test", "oxfmt src jest --check").kind, "ok");
});

test("ok: a debug invocation (node --inspect-brk …/jest.js)", () => {
  assert.equal(
    classifyScript("test", "node --inspect-brk ./node_modules/jest/bin/jest.js --runInBand").kind,
    "ok",
  );
});

test("ok: a detox script by value", () => {
  assert.equal(classifyScript("test", "pnpm detox test").kind, "ok");
});

test("ok: already routed through the wrapper", () => {
  assert.equal(classifyScript("coverage", "test-quarantine run jest -- --coverage").kind, "ok");
});

test("ok: delegating to another pnpm test script (the leaf is guarded on its own)", () => {
  assert.equal(classifyScript("test", "pnpm test:jest:coverage && pnpm test:env").kind, "ok");
  assert.equal(
    classifyScript("test", "pnpm test:jest:coverage && pnpm test:playwright").kind,
    "ok",
  );
});

test("ok: a non-jest script", () => {
  assert.equal(classifyScript("test", "exit 0").kind, "ok");
  assert.equal(classifyScript("test", "pnpm -w -F ui build-and-test").kind, "ok");
});
