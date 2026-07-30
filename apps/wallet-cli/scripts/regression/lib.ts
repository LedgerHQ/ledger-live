// Shared harness plumbing for the wallet-cli regression suites.
// Imported by run.ts — not runnable on its own.

import {
  accessSync,
  appendFileSync,
  constants,
  existsSync,
  mkdtempSync,
  readFileSync,
  statSync,
} from "node:fs";
import { extname, join } from "node:path";

export const APP_NAME = "ledger-wallet-cli";

const GREEN = "\u001B[32m";
const RED = "\u001B[31m";
const YELLOW = "\u001B[33m";
const DIM = "\u001B[2m";
const OFF = "\u001B[0m";

export const colors = { green: GREEN, red: RED, yellow: YELLOW, dim: DIM, off: OFF } as const;

export type RunConfig = {
  readonly repoRoot: string;
  readonly walletCliDir: string;
  readonly expectedVersion: string;
  /** argv of the CLI under test: a built binary, or `pnpm … wallet-cli start`. */
  readonly binArgv: readonly string[];
  readonly binLabel: string;
  readonly caseTimeoutMs: number;
  readonly gateTimeoutMs: number;
  readonly tmpRoot: string;
  readonly logFile: string;
  readonly isoState: string;
  readonly isoHome: string;
  /** Pinned state dir for Suite D (--session); undefined means the developer's real one. */
  readonly sessionDir: string | undefined;
  readonly withBuild: boolean;
};

type EnvSpec = {
  readonly set: Readonly<Record<string, string>>;
  readonly unset: readonly string[];
};

export type SpawnResult = { out: string; err: string; rc: number; timedOut: boolean };

/**
 * Environment that keeps the developer's real state, agent dirs and home out of
 * the way. `XDG_STATE_HOME`/`HOME` cover POSIX; win32 needs `LOCALAPPDATA`
 * (what @bunli/utils `stateDir` reads there) and `USERPROFILE` (what
 * `os.homedir()` reads — it ignores `HOME`).
 */
export function isolatedEnv(stateHome: string, home: string): Record<string, string> {
  const env: Record<string, string> = { XDG_STATE_HOME: stateHome, HOME: home };
  if (process.platform === "win32") {
    env.USERPROFILE = home;
    env.LOCALAPPDATA = stateHome;
    env.APPDATA = join(home, "AppData", "Roaming");
  }
  return env;
}

/** Same redirection as isolatedEnv, but for the state dir only (home is left alone). */
export function isolatedStateEnv(stateHome: string): Record<string, string> {
  const env: Record<string, string> = { XDG_STATE_HOME: stateHome };
  if (process.platform === "win32") env.LOCALAPPDATA = stateHome;
  return env;
}

/** Where @bunli/utils `stateDir(APP_NAME)` lands for a given isolated state home. */
export function stateAppDir(stateHome: string): string {
  return process.platform === "win32"
    ? join(stateHome, APP_NAME, "State")
    : join(stateHome, APP_NAME);
}

/** pnpm on Windows is a `.cmd` shim, which CreateProcess cannot exec directly. */
export function commandArgv(argv: readonly string[]): string[] {
  if (process.platform !== "win32") return [...argv];
  const [command, ...rest] = argv;
  if (/[\\/]/.test(command) || extname(command) !== "") return [...argv];
  return ["cmd.exe", "/d", "/s", "/c", command, ...rest];
}

// --- JSON accessors ----------------------------------------------------------

/** Reads a dotted path (`results.0.status`) out of a parsed JSON value. */
export function jsonAt(value: unknown, path: string): unknown {
  let current = value;
  for (const key of path.split(".")) {
    if (Array.isArray(current)) current = current[Number(key)];
    else if (typeof current === "object" && current !== null)
      current = (current as Record<string, unknown>)[key];
    else return undefined;
    if (current === undefined) return undefined;
  }
  return current;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** Every object anywhere in the tree — the equivalent of jq's `.. | objects`. */
export function objectsDeep(value: unknown): Record<string, unknown>[] {
  const found: Record<string, unknown>[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    const record = asRecord(node);
    if (!record) return;
    found.push(record);
    for (const item of Object.values(record)) walk(item);
  };
  walk(value);
  return found;
}

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

export class Harness {
  passCount = 0;
  failCount = 0;
  skipCount = 0;
  readonly failedIds: string[] = [];

  out = "";
  err = "";
  rc = 0;
  cwd: string;

  private currentId = "";
  private currentDesc = "";
  private caseErrors: string[] = [];
  private env: EnvSpec = { set: {}, unset: [] };

  constructor(readonly config: RunConfig) {
    this.cwd = config.repoRoot;
  }

  log(line: string): void {
    appendFileSync(this.config.logFile, `${line}\n`);
  }

  print(line: string): void {
    process.stdout.write(`${line}\n`);
  }

  // --- case lifecycle --------------------------------------------------------

  caseStart(id: string, desc: string): void {
    this.currentId = id;
    this.currentDesc = desc;
    this.caseErrors = [];
    this.log("");
    this.log(`=== ${id} — ${desc} ===`);
  }

  caseEnd(): void {
    if (this.caseErrors.length === 0) {
      this.passCount++;
      this.print(`${GREEN}[PASS]${OFF} ${this.currentId.padEnd(5)} ${this.currentDesc}`);
      return;
    }
    this.failCount++;
    this.failedIds.push(this.currentId);
    this.print(`${RED}[FAIL]${OFF} ${this.currentId.padEnd(5)} ${this.currentDesc}`);
    for (const error of this.caseErrors) {
      this.print(`       ${DIM}${error}${OFF}`);
      this.log(`  FAILURE: ${error}`);
    }
  }

  caseSkip(id: string, desc: string, reason: string): void {
    this.skipCount++;
    this.print(`${YELLOW}[SKIP]${OFF} ${id.padEnd(5)} ${desc} ${DIM}(${reason})${OFF}`);
    this.log(`=== ${id} — SKIPPED: ${reason} ===`);
  }

  failCase(message: string): void {
    this.caseErrors.push(message);
  }

  // --- assertions ------------------------------------------------------------

  assertRc(expected: number): void {
    if (this.rc !== expected) this.failCase(`exit code: expected ${expected}, got ${this.rc}`);
  }

  assertRcNonZero(): void {
    if (this.rc === 0) this.failCase("exit code: expected non-zero, got 0");
  }

  assertHas(haystack: string, needle: string, label = "output"): void {
    if (!haystack.includes(needle)) this.failCase(`${label} does not contain: ${needle}`);
  }

  assertLacks(haystack: string, needle: string, label = "output"): void {
    if (haystack.includes(needle)) this.failCase(`${label} unexpectedly contains: ${needle}`);
  }

  assertEmpty(text: string, label = "output"): void {
    if (text.trim() !== "") this.failCase(`${label} expected empty, got: ${text.slice(0, 200)}`);
  }

  assertNonEmpty(text: string, label = "output"): void {
    if (text.trim() === "") this.failCase(`${label} expected non-empty`);
  }

  assertFile(path: string): void {
    if (!existsSync(path) || !statSync(path).isFile()) this.failCase(`missing file: ${path}`);
  }

  assertNoFile(path: string): void {
    if (existsSync(path)) this.failCase(`file should not exist: ${path}`);
  }

  assertMode(path: string, expected: number): void {
    try {
      const mode = statSync(path).mode & 0o777;
      if (mode !== expected)
        this.failCase(`mode of ${path}: expected ${expected.toString(8)}, got ${mode.toString(8)}`);
    } catch {
      this.failCase(`mode of ${path}: cannot stat`);
    }
  }

  /** Parses `text` as JSON, recording a failure (and returning undefined) when it is not. */
  assertJson(text: string, label = "output"): unknown {
    const value = parseJson(text);
    if (value === undefined) this.failCase(`${label} is not valid JSON`);
    return value;
  }

  assertField(value: unknown, path: string, expected: string, label?: string): void {
    const got = jsonAt(value, path);
    const rendered = typeof got === "string" ? got : JSON.stringify(got);
    if (rendered !== expected)
      this.failCase(`${label ?? path}: expected '${expected}', got '${rendered}'`);
  }

  assertThat(condition: boolean, message: string): void {
    if (!condition) this.failCase(message);
  }

  assertFileContains(path: string, needle: string, message: string): void {
    if (!readFileSync(path, "utf8").includes(needle)) this.failCase(message);
  }

  assertFileLacks(path: string, needle: string, message: string): void {
    if (readFileSync(path, "utf8").includes(needle)) this.failCase(message);
  }

  // --- environment -----------------------------------------------------------

  setEnv(set: Readonly<Record<string, string>>, unset: readonly string[] = []): void {
    this.env = { set, unset };
  }

  /** Default env for non-nudge cases: isolated state dir and home, nudge muted. */
  isoEnv(): void {
    this.setEnv({
      WALLET_CLI_NO_NUDGE: "1",
      ...isolatedEnv(this.config.isoState, this.config.isoHome),
    });
  }

  /** Env that keeps a real session (the developer's, or the one pinned by --session). */
  realEnv(): void {
    const { sessionDir } = this.config;
    this.setEnv({
      WALLET_CLI_NO_NUDGE: "1",
      ...(sessionDir ? isolatedStateEnv(sessionDir) : {}),
    });
  }

  // --- CLI invocation --------------------------------------------------------

  /** Runs the CLI under test, capturing stdout/stderr/exit code into out/err/rc. */
  async cli(...args: string[]): Promise<void> {
    const label = [
      ...this.env.unset.map(name => `-u ${name}`),
      ...Object.entries(this.env.set).map(([key, value]) => `${key}=${value}`),
    ].join(" ");
    this.log(`$ ${label} ${this.config.binLabel} ${args.join(" ")}`);

    const result = await this.spawn([...this.config.binArgv, ...args], {
      cwd: this.cwd,
      timeoutMs: this.config.caseTimeoutMs,
    });
    this.out = result.out;
    this.err = result.err;
    this.rc = result.rc;
    this.log(`--- rc=${this.rc}`);
    this.log("--- stdout");
    this.log(this.out);
    this.log("--- stderr");
    this.log(this.err);
    if (result.timedOut) this.failCase(`timed out after ${this.config.caseTimeoutMs / 1000}s`);
  }

  async spawn(
    argv: readonly string[],
    options: { cwd: string; timeoutMs: number },
  ): Promise<SpawnResult> {
    // Unset first: a case that opts back into a signal it just cleared (Suite C)
    // must keep the value it set.
    const env: Record<string, string | undefined> = { ...process.env };
    for (const name of this.env.unset) delete env[name];
    Object.assign(env, this.env.set);

    const proc = Bun.spawn({
      cmd: commandArgv(argv),
      cwd: options.cwd,
      env,
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      timeout: options.timeoutMs,
    });
    const [out, err] = await Promise.all([
      new Response(proc.stdout).text(),
      new Response(proc.stderr).text(),
    ]);
    await proc.exited;
    // The harness never signals its children, so a null exit code means the
    // spawn timeout killed it. 124 is the conventional `timeout` exit code.
    const timedOut = proc.exitCode === null;
    return { out, err, rc: proc.exitCode ?? 124, timedOut };
  }

  // --- scratch space ---------------------------------------------------------

  freshState(): string {
    return mkdtempSync(join(this.config.tmpRoot, "state."));
  }

  freshDir(): string {
    return mkdtempSync(join(this.config.tmpRoot, "work."));
  }
}

/** Why file-mode assertions are meaningless here, if they are: NTFS has no mode bits, root ignores them. */
export function modeAssertionsUnsupported(): string | undefined {
  if (process.platform === "win32") return "file modes are not meaningful on Windows";
  if (process.getuid?.() === 0) return "running as root, which ignores mode bits";
  return undefined;
}

export function isExecutableFile(path: string): boolean {
  if (!existsSync(path) || !statSync(path).isFile()) return false;
  if (process.platform === "win32") return true;
  try {
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
