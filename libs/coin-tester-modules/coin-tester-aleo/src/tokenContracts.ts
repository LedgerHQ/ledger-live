import { createHash } from "crypto";

export type TokenProgram = { id: string; source: string };

const PROVABLE_EXPLORER_API = "https://api.explorer.provable.com/v1";

const FETCH_TIMEOUT_MS = 15_000;

type PinnedProgram = { network: "mainnet" | "testnet"; edition: number; sha256: string };

/**
 * Sources byte-identical to the pinned `aleo-backend` image. `merkle_tree.aleo` comes
 * from mainnet: every testnet edition differs from the backend's copy.
 */
const PINNED_PROGRAMS: Readonly<Record<string, PinnedProgram>> = {
  "merkle_tree.aleo": {
    network: "mainnet",
    edition: 0,
    sha256: "42382123ebbe9a82466e49ddc85a7c0bb59d0082e26b0e0c396d5128ee26d293",
  },
  "test_usad_multisig_core.aleo": {
    network: "testnet",
    edition: 0,
    sha256: "dbcb810c63354a5bdcea9dad03c2ad1eef78d2697a09779641e60a908592b0a9",
  },
  "test_usad_freezelist.aleo": {
    network: "testnet",
    edition: 0,
    sha256: "bb9cbd44c415c0001c8662e7d1b96ff117a20fab6f93dcdc9eb6161d090e6896",
  },
  "test_usad_stablecoin.aleo": {
    network: "testnet",
    edition: 2,
    sha256: "4d6edee92efb8343f8aa8e15c70c1c7fd4f235e63e9a0dd0bcdadbf4827e7781",
  },
  "ldg_p_1114.aleo": {
    network: "mainnet",
    edition: 0,
    sha256: "49c1fbb81c42763374cb6b4133a4e1ff68632ff38525536817f31fc0cb3aa65f",
  },
};

/** Deploy order for the ARC-22 token chain: every program's imports must already be on chain when it deploys. */
const TOKEN_PROGRAM_IDS = [
  "merkle_tree.aleo",
  "test_usad_multisig_core.aleo",
  "test_usad_freezelist.aleo",
  "test_usad_stablecoin.aleo",
] as const;

/**
 * Admin gate literal per program. `test_usad_multisig_core.aleo` uses a different
 * address from the other two.
 */
const ADMIN_LITERAL_PATCHES: Readonly<Record<string, string>> = {
  "test_usad_multisig_core.aleo": "aleo1g3v24z8ke26c0vun3ma9p56r74pqqkpshmhcjj5ywc32hmuf0sgsr7fmjx",
  "test_usad_freezelist.aleo": "aleo1r4l65lh2ugw86hq4j7ncva42ce42z6pmsp9nlny3swqce6ya6s8qjce6mh",
  "test_usad_stablecoin.aleo": "aleo1r4l65lh2ugw86hq4j7ncva42ce42z6pmsp9nlny3swqce6ya6s8qjce6mh",
};

const sourceCache = new Map<string, string>();

async function fetchPinnedSource(programId: string, pin: PinnedProgram): Promise<string> {
  const url = `${PROVABLE_EXPLORER_API}/${pin.network}/program/${programId}/${pin.edition}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`aleo coin-tester: GET ${url} failed with HTTP ${response.status}`);
  }
  // The route answers with a JSON string, not a bare body.
  const source = (await response.json()) as string;
  const digest = createHash("sha256").update(source, "utf8").digest("hex");
  if (digest !== pin.sha256) {
    throw new Error(
      `aleo coin-tester: ${url} served a source with SHA-256 ${digest}, expected ${pin.sha256} — it no longer matches the aleo-backend image`,
    );
  }
  return source;
}

/**
 * Call before any msw server listens: `onUnhandledRequest` rejects every
 * non-localhost request, the explorer API included.
 */
export async function fetchProgramSources(): Promise<void> {
  await Promise.all(
    Object.entries(PINNED_PROGRAMS).map(async ([programId, pin]) => {
      if (sourceCache.has(programId)) return;
      sourceCache.set(programId, await fetchPinnedSource(programId, pin));
    }),
  );
}

/**
 * Replaces the program's admin gate literal with `adminAddress`. Throws when a listed
 * literal is missing: a silent miss deploys a program nobody can initialize.
 */
export function patchAdminLiteral(source: string, programId: string, adminAddress: string): string {
  const literal = ADMIN_LITERAL_PATCHES[programId];
  if (!literal) return source;

  if (!source.includes(literal)) {
    throw new Error(
      `aleo coin-tester: expected admin gate literal ${literal} in ${programId}, but it is gone — the pinned source changed`,
    );
  }

  return source.replaceAll(literal, adminAddress);
}

export function loadTokenPrograms(adminAddress: string): TokenProgram[] {
  return TOKEN_PROGRAM_IDS.map(programId => ({
    id: programId,
    source: patchAdminLiteral(readRawProgramSource(programId), programId, adminAddress),
  }));
}

/**
 * The unpatched source `aleo-backend` computes `program_checksum` from at signing time.
 * Requires a prior `fetchProgramSources()`.
 */
export function readRawProgramSource(programId: string): string {
  if (!hasPinnedSource(programId)) {
    throw new Error(`aleo coin-tester: no pinned source for program ${programId}`);
  }
  const source = sourceCache.get(programId);
  if (source === undefined) {
    throw new Error(
      `aleo coin-tester: source for ${programId} is not fetched — call fetchProgramSources() first`,
    );
  }
  return source;
}

/** Whether `readRawProgramSource` can serve `programId`. `credits.aleo` is not pinned. */
export function hasPinnedSource(programId: string): boolean {
  return Object.hasOwn(PINNED_PROGRAMS, programId);
}
