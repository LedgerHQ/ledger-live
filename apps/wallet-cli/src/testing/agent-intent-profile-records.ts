import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeSessionIn } from "./session-fixture";
import { stateHomeEnv, type StateHomeEnv } from "./state-home";

const PUBLIC_KEY = "0236cb7ebc1a324bd02abac533f7904f9579cc581c772285fecc6f5157a960b076";

/** An Agent Intent profile as `session.yaml` stores it: pending enrollment unless `overrides` say otherwise. */
export function profileRecord(
  profileId: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    profileId,
    displayName: `Agent ${profileId}`,
    description: "Remote agent that proposes intents for review.",
    source: "openclaw",
    environment: "staging",
    bffBaseUrl: "https://global.api.stg.ledger-test.com/agent-intent",
    publicKey: PUBLIC_KEY,
    enrollmentExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

/** A temp state dir whose session holds these profile records, valid or not. No agent key is stored. */
export function makeProfilesDir(records: readonly unknown[]): {
  env: StateHomeEnv;
  cleanup: () => void;
} {
  const stateHome = mkdtempSync(join(tmpdir(), "wallet-cli-test-"));
  writeSessionIn(stateHome, { accounts: [], agentIntentProfiles: records });
  return {
    env: stateHomeEnv(stateHome),
    cleanup: () => rmSync(stateHome, { recursive: true, force: true }),
  };
}
