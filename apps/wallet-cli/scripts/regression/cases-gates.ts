// Suite A — repo / artifact gates. Slow; opt in with --with-gates.
// These are the same checks CI runs, plus the packaging smoke tests that matter
// for a release. No device, no session.

import type { Harness } from "./lib";

async function gate(h: Harness, id: string, desc: string, ...argv: string[]): Promise<void> {
  h.caseStart(id, desc);
  h.setEnv({});
  h.log(`$ ${argv.join(" ")}`);
  const { out, err, rc, timedOut } = await h.spawn(argv, {
    cwd: h.config.walletCliDir,
    timeoutMs: h.config.gateTimeoutMs,
  });
  const output = out + err;
  const lines = output.split("\n");
  h.log(`--- rc=${rc}`);
  h.log(lines.slice(-100).join("\n"));
  if (timedOut) {
    h.failCase(`timed out after ${h.config.gateTimeoutMs / 1000}s`);
  } else if (rc !== 0) {
    const tail = lines
      .filter(l => l.trim() !== "")
      .slice(-3)
      .join(" ")
      .slice(0, 300);
    h.failCase(`exit ${rc} — see ${h.config.logFile} (tail: ${tail})`);
  }
  h.caseEnd();
}

export async function suiteA(h: Harness): Promise<void> {
  await gate(h, "A1", "unit tests (bun test src/)", "pnpm", "test");
  await gate(h, "A2", "typecheck (tsc --noEmit)", "pnpm", "typecheck");
  await gate(h, "A3", "lint (oxlint --quiet)", "pnpm", "lint:ci");
  await gate(h, "A4", "format check (oxfmt --check)", "pnpm", "format:check");
  await gate(h, "A5", "embedded skill generation (check:skills)", "pnpm", "check:skills");
  await gate(h, "A6", "third-party notices up to date", "pnpm", "check:notices");

  if (h.config.withBuild) {
    await gate(h, "A7", "build all platform binaries", "pnpm", "build");
    await gate(h, "A8", "npm tarball layout (pack:check)", "pnpm", "pack:check");
    await gate(h, "A9", "install-and-run smoke (smoke:npm)", "pnpm", "smoke:npm");
  } else {
    h.caseSkip("A7", "build all platform binaries", "pass --with-build");
    h.caseSkip("A8", "npm tarball layout", "pass --with-build");
    h.caseSkip("A9", "install-and-run smoke", "pass --with-build");
  }
}
