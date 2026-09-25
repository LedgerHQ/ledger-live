import { readFileSync } from "fs";
import path from "path";

export type TokenProgram = { id: string; source: string };

const CONTRACTS_DIR = path.resolve(__dirname, "../aleo-backend/contracts");

/** Deploy order for the ARC-22 token chain: every program's imports must already be on chain when it deploys. */
const TOKEN_PROGRAM_FILES = [
  "merkle_tree.aleo",
  "test_usad_multisig_core.aleo",
  "test_usad_freezelist.aleo",
  "test_usad_stablecoin.aleo",
] as const;

/**
 * Every vendored program source, for lookups that are not the ARC-22 token
 * bootstrap. `ldg_p_1114.aleo` only imports `credits.aleo`, which we never
 * deploy, so it carries no ordering constraint against the token chain and
 * sits last.
 */
const PROGRAM_FILES = [...TOKEN_PROGRAM_FILES, "ldg_p_1114.aleo"] as const;

/**
 * Every gate address these four programs assert against, keyed by the file
 * that carries it. `test_usad_multisig_core.aleo` uses a different address
 * from the other two — a patch that looks for one literal walks past it and
 * changes nothing.
 */
const ADMIN_LITERAL_PATCHES: Readonly<Record<string, string>> = {
  "test_usad_multisig_core.aleo": "aleo1g3v24z8ke26c0vun3ma9p56r74pqqkpshmhcjj5ywc32hmuf0sgsr7fmjx",
  "test_usad_freezelist.aleo": "aleo1r4l65lh2ugw86hq4j7ncva42ce42z6pmsp9nlny3swqce6ya6s8qjce6mh",
  "test_usad_stablecoin.aleo": "aleo1r4l65lh2ugw86hq4j7ncva42ce42z6pmsp9nlny3swqce6ya6s8qjce6mh",
};

/**
 * Replaces every occurrence of the file's admin gate literal with
 * `adminAddress`. `merkle_tree.aleo` carries no such literal and passes
 * through unchanged. Throws when a listed literal is missing: a silent miss
 * deploys a program nobody can initialize, surfacing only much later as a
 * rejected deployment.
 */
export function patchAdminLiteral(source: string, file: string, adminAddress: string): string {
  const literal = ADMIN_LITERAL_PATCHES[file];
  if (!literal) return source;

  if (!source.includes(literal)) {
    throw new Error(
      `aleo coin-tester: expected admin gate literal ${literal} in ${file}, but it is gone — the vendored source changed`,
    );
  }

  return source.replaceAll(literal, adminAddress);
}

export function loadTokenPrograms(adminAddress: string): TokenProgram[] {
  return TOKEN_PROGRAM_FILES.map(file => ({
    id: file,
    source: patchAdminLiteral(
      readFileSync(path.join(CONTRACTS_DIR, file), "utf8"),
      file,
      adminAddress,
    ),
  }));
}

/**
 * The raw, unpatched vendored source for `programId` — the same bytes
 * `aleo-backend`'s own `include_str!`-compiled copy carries, admin gate
 * literal and all. `aleo-backend` computes a request's `program_checksum`
 * from this unpatched copy at signing time, not from whatever the coin-tester
 * later deploys on chain (which has the gate literal replaced with the real
 * admin address) — so verifying a signature against the on-chain source
 * would recompute a different checksum than the one actually signed.
 */
export function readRawProgramSource(programId: string): string {
  const file = PROGRAM_FILES.find(candidate => candidate === programId);
  if (!file) {
    throw new Error(`aleo coin-tester: no vendored source for program ${programId}`);
  }
  return readFileSync(path.join(CONTRACTS_DIR, file), "utf8");
}

/** Whether `readRawProgramSource` can serve `programId`. `credits.aleo` is not vendored. */
export function hasVendoredSource(programId: string): boolean {
  return PROGRAM_FILES.some(candidate => candidate === programId);
}
