/**
 * Classifier for package.json test scripts (PRD §8.1), used by the CI
 * bypass-guard: "does this allowlisted script invoke jest directly instead of
 * routing through the wrapper?".
 *
 * Pure (no fs); callers pass a script name + value.
 */

/**
 * Script NAMES in scope for the guard. A jest invocation under any other name
 * (e.g. `jest:debug`, `format`) is left alone — see the `ok` rules below.
 */
export const ALLOWLISTED_SCRIPT_NAMES = new Set<string>([
  "test",
  "test:jest",
  "test:jest:coverage",
  "coverage",
  "ci-test-unit",
  "test:unit",
  "unit-test",
]);

/** Outcome of classifying a single script. */
export type ScriptClassification =
  | { kind: "bypass"; reason: string } // allowlisted, invokes raw jest, NOT via the wrapper
  | { kind: "ok" }; // already wrapped, delegated, a non-runner jest reference, or not jest

/**
 * A debug invocation runs jest's bin directly under the node inspector; it is
 * never a CI path and keeps its raw `node --inspect-brk …/jest.js` form.
 */
function isDebugInvocation(value: string): boolean {
  return /--inspect(-brk|-wait)?\b/.test(value) || /jest\.js\b/.test(value);
}

// Runner detection uses a small linear tokenizer — split on command separators,
// strip known prefixes, inspect the runner token — O(n) over the script string.

/** env-cmd flags that consume the FOLLOWING token as their value. */
const ENVCMD_VALUE_FLAGS = new Set(["-f", "--file", "-e", "--environments", "-r", "--rc-file"]);

/** Split a script value into command segments on top-level separators. */
function splitSegments(value: string): string[] {
  return value
    .split(/&&|\|\||;/)
    .map(s => s.trim())
    .filter(Boolean);
}

function isEnvAssignment(token: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*=/.test(token);
}

interface SegmentInfo {
  /** The runner token (after any env/cross-env/env-cmd/pnpm prefix), or "". */
  runner: string;
  /** When launched via `pnpm [run] <script>` and the script isn't jest, its name. */
  pnpmScript: string | undefined;
}

/**
 * Walk one command segment, skipping leading env assignments and known wrapper
 * prefixes (`cross-env`, `env-cmd -f x`, `pnpm [exec|run]`) to find the token in
 * RUNNER position.
 */
function analyzeSegment(segment: string): SegmentInfo {
  const tokens = segment.split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (isEnvAssignment(t) || t === "cross-env") {
      i += 1;
      continue;
    }
    if (t === "env-cmd") {
      i += 1;
      while (i < tokens.length && tokens[i].startsWith("-")) {
        const flag = tokens[i];
        i += 1;
        const takesValue = ENVCMD_VALUE_FLAGS.has(flag) && !flag.includes("=");
        if (takesValue && i < tokens.length && !tokens[i].startsWith("-")) i += 1;
      }
      continue;
    }
    break;
  }

  if (tokens[i] === "pnpm") {
    i += 1;
    if (tokens[i] === "exec" || tokens[i] === "run") i += 1;
    const runner = tokens[i] ?? "";
    return { runner, pnpmScript: runner && runner !== "jest" ? runner : undefined };
  }
  return { runner: tokens[i] ?? "", pnpmScript: undefined };
}

/** Does the value invoke jest as its RUNNER in any command segment? */
function isJestRunner(value: string): boolean {
  return splitSegments(value).some(seg => analyzeSegment(seg).runner === "jest");
}

/**
 * `oxfmt … jest` / `oxlint … jest` etc.: jest is a PATH argument to a
 * formatter/linter, not the runner.
 */
function isFormatterPathArg(value: string): boolean {
  return /\b(?:oxfmt|oxlint|prettier|eslint|biome)\b[^&|;]*\bjest\b/.test(value);
}

/** Detox / mobile-e2e scripts — routed as detox, not jest; out of scope here. */
function isDetoxOrE2e(name: string, value: string): boolean {
  return (
    /\bdetox\b/.test(value) ||
    /^e2e:/.test(name) ||
    name === "mock:test" ||
    /:detox$/.test(name) ||
    /\bdetox test\b/.test(value)
  );
}

/** Already routed through the wrapper. */
function isAlreadyWrapped(value: string): boolean {
  return value.includes("test-quarantine run jest");
}

/** Does the value invoke jest only indirectly, via another pnpm test:* script? */
function delegatesToPnpmScript(value: string): boolean {
  if (isJestRunner(value)) return false; // a direct jest runner is not "indirect"
  return splitSegments(value).some(seg => {
    const { pnpmScript } = analyzeSegment(seg);
    return pnpmScript !== undefined && /^test[:\w-]*$/.test(pnpmScript);
  });
}

/** Is jest run as a runner AND followed by another chained command (e.g. `pnpm jest … && git diff`)? */
function isChainedJest(value: string): boolean {
  const infos = splitSegments(value).map(analyzeSegment);
  const jestIdx = infos.findIndex(s => s.runner === "jest");
  return jestIdx !== -1 && jestIdx < infos.length - 1;
}

/**
 * Classify a single (name, value) script for the bypass guard. An allowlisted
 * script that invokes jest directly (not via the wrapper) is a `bypass`;
 * everything else — already-wrapped, delegating to another pnpm script, a
 * non-runner jest reference (debug / formatter path arg), detox, or not jest at
 * all — is `ok`.
 */
export function classifyScript(name: string, value: string): ScriptClassification {
  if (!ALLOWLISTED_SCRIPT_NAMES.has(name)) return { kind: "ok" };
  if (isDetoxOrE2e(name, value)) return { kind: "ok" };
  if (isDebugInvocation(value)) return { kind: "ok" };
  if (isFormatterPathArg(value)) return { kind: "ok" };
  if (isAlreadyWrapped(value)) return { kind: "ok" };

  // A jest runner chained with another command (e.g. live-common's
  // `pnpm jest … && git diff`) still bypasses the wrapper — wrap the jest segment.
  if (isChainedJest(value)) {
    return {
      kind: "bypass",
      reason: "jest invocation is chained with another command (&&/;) — wrap only the jest segment",
    };
  }
  // Delegating to another pnpm test script (e.g. `pnpm test:jest:coverage`) is
  // fine: the leaf script is guarded on its own.
  if (delegatesToPnpmScript(value)) return { kind: "ok" };

  if (isJestRunner(value)) return { kind: "bypass", reason: "invokes jest directly" };

  return { kind: "ok" };
}
