// Suite C — the one-time, agent-aware first-run nudge (introduced in 2.1.0).
// Every case gets a pristine state dir so the "once per user" marker is never
// inherited. `session view` is used as the cheapest "real command".

import { chmodSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  asString,
  isolatedEnv,
  jsonAt,
  modeAssertionsUnsupported,
  stateAppDir,
  type Harness,
} from "./lib";

const MARKER_FILE = "first-run.json";

// Agent signals the developer's own shell may already carry: unset them so each
// case only sees the one it opts back into.
const AGENT_SIGNALS = [
  "WALLET_CLI_NO_NUDGE",
  "CLAUDECODE",
  "CLAUDE_CODE",
  "CURSOR_AGENT",
  "CODEX_ENABLED",
  "GEMINI_CLI",
  "OPENCODE",
  "AMP_CURRENT_THREAD_ID",
  "AGENT",
];

export async function suiteC(h: Harness): Promise<void> {
  const nudgeEnv = (stateHome: string, extra: Record<string, string> = {}): void =>
    h.setEnv({ ...isolatedEnv(stateHome, h.config.isoHome), ...extra }, AGENT_SIGNALS);
  const marker = (stateHome: string): string => join(stateAppDir(stateHome), MARKER_FILE);

  // ---- C1: shown once for a detected agent ----------------------------------
  let s = h.freshState();
  h.caseStart("C1", "first real command prints the Claude Code nudge on stderr only");
  nudgeEnv(s, { CLAUDECODE: "1" });
  await h.cli("session", "view");
  h.assertRc(0);
  h.assertHas(h.err, "wallet-cli skill install --agent claude", "stderr");
  h.assertHas(h.err, "Claude Code", "stderr");
  h.assertLacks(h.out, "skill install", "stdout");
  h.caseEnd();

  // ---- C2: never shown twice ------------------------------------------------
  h.caseStart("C2", "the nudge is not repeated on the next command");
  nudgeEnv(s, { CLAUDECODE: "1" });
  await h.cli("session", "view");
  h.assertRc(0);
  h.assertLacks(h.err, "skill install", "stderr");
  h.caseEnd();

  // ---- C3: marker file ------------------------------------------------------
  const c3Desc = "the marker is persisted under the state dir with 0600/0700 perms";
  const unsupported = modeAssertionsUnsupported();
  if (unsupported) {
    h.caseSkip("C3", c3Desc, unsupported);
  } else {
    h.caseStart("C3", c3Desc);
    h.assertFile(marker(s));
    h.assertMode(marker(s), 0o600);
    h.assertMode(stateAppDir(s), 0o700);
    if (existsSync(marker(s))) {
      const parsed = h.assertJson(readFileSync(marker(s), "utf8"), "marker");
      h.assertField(parsed, "version", h.config.expectedVersion, "marker.version");
      h.assertThat(
        /^\d{4}-/.test(asString(jsonAt(parsed, "nudgeShownAt")) ?? ""),
        "marker.nudgeShownAt is not an ISO timestamp",
      );
    }
    h.caseEnd();
  }

  // ---- C4: silent under --output json, and not consumed ---------------------
  s = h.freshState();
  h.caseStart("C4", "--output json is nudge-free and does not consume the one-time hint");
  nudgeEnv(s, { CLAUDECODE: "1" });
  await h.cli("session", "view", "--output", "json");
  h.assertRc(0);
  h.assertEmpty(h.err, "stderr");
  h.assertJson(h.out);
  h.assertNoFile(marker(s));
  nudgeEnv(s, { CLAUDECODE: "1" });
  await h.cli("session", "view");
  h.assertHas(h.err, "skill install", "stderr (after a json run)");
  h.caseEnd();

  // ---- C5: opt-out ----------------------------------------------------------
  s = h.freshState();
  h.caseStart("C5", "WALLET_CLI_NO_NUDGE=1 suppresses the nudge and writes no marker");
  nudgeEnv(s, { CLAUDECODE: "1", WALLET_CLI_NO_NUDGE: "1" });
  await h.cli("session", "view");
  h.assertRc(0);
  h.assertLacks(h.err, "skill install", "stderr");
  h.assertNoFile(marker(s));
  h.caseEnd();

  // ---- C6: quiet in plain pipes ---------------------------------------------
  s = h.freshState();
  h.caseStart("C6", "no agent env and a non-TTY stderr stays silent");
  nudgeEnv(s);
  await h.cli("session", "view");
  h.assertRc(0);
  h.assertLacks(h.err, "skill install", "stderr");
  h.assertNoFile(marker(s));
  h.caseEnd();

  // ---- C7: per-agent tailoring ----------------------------------------------
  h.caseStart("C7", "each detected agent maps to its own --agent value");
  const agents = [
    { signal: "CURSOR_AGENT", value: "1", expect: "--agent cursor", label: "Cursor" },
    { signal: "CODEX_ENABLED", value: "1", expect: "--agent codex", label: "Codex" },
    { signal: "GEMINI_CLI", value: "1", expect: "--agent agents", label: "Gemini CLI" },
    { signal: "OPENCODE", value: "1", expect: "--agent agents", label: "opencode" },
    { signal: "AMP_CURRENT_THREAD_ID", value: "x", expect: "--agent agents", label: "amp" },
  ];
  for (const agent of agents) {
    nudgeEnv(h.freshState(), { [agent.signal]: agent.value });
    await h.cli("session", "view");
    h.assertHas(h.err, `wallet-cli skill install ${agent.expect}`, `stderr for ${agent.signal}`);
    h.assertHas(h.err, agent.label, `stderr label for ${agent.signal}`);
  }
  h.caseEnd();

  // ---- C8: non-command invocations do not consume the nudge -----------------
  for (const invocation of ["--help", "--version"]) {
    s = h.freshState();
    h.caseStart(
      `C8${invocation.replaceAll("-", "")}`,
      `${invocation} does not consume the one-time nudge`,
    );
    nudgeEnv(s, { CLAUDECODE: "1" });
    await h.cli(invocation);
    h.assertNoFile(marker(s));
    h.assertLacks(h.err, "skill install", `stderr of ${invocation}`);
    nudgeEnv(s, { CLAUDECODE: "1" });
    await h.cli("session", "view");
    h.assertHas(h.err, "skill install", "stderr of the following real command");
    h.caseEnd();
  }

  // ---- C9: skill commands are exempt ----------------------------------------
  s = h.freshState();
  h.caseStart("C9", "skill * commands never show the nudge nor consume it");
  nudgeEnv(s, { CLAUDECODE: "1" });
  await h.cli("skill", "list");
  h.assertRc(0);
  h.assertLacks(h.err, "Tip: install", "stderr");
  h.assertNoFile(marker(s));
  h.caseEnd();

  // ---- C10: exit codes are untouched ----------------------------------------
  s = h.freshState();
  h.caseStart("C10", "the nudge does not alter a failing command's exit code");
  nudgeEnv(s, { CLAUDECODE: "1" });
  await h.cli("balances", "no-such-label-9");
  h.assertRc(1);
  h.assertHas(h.err, "skill install", "stderr");
  h.caseEnd();

  // ---- C11: hostile state dir -----------------------------------------------
  const c11Desc = "a read-only state dir never breaks the command";
  if (unsupported) {
    h.caseSkip("C11", c11Desc, unsupported);
    return;
  }
  s = h.freshState();
  h.caseStart("C11", c11Desc);
  chmodSync(s, 0o500);
  nudgeEnv(s, { CLAUDECODE: "1" });
  await h.cli("session", "view", "--output", "json");
  h.assertRc(0);
  h.assertJson(h.out);
  chmodSync(s, 0o700);
  h.caseEnd();
}
