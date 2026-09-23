import { YAML } from "bun";
import { stateDir } from "@bunli/utils";
import { join } from "node:path";
import { chmodSync, mkdirSync } from "node:fs";
import { z } from "zod";
import { SUPPORTED_AGENT_SOURCES, type AgentIntentEnvironment } from "@ledgerhq/agent-intent-sdk";
import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";
import { serializeV1 } from "../shared/accountDescriptor";
import { writeSecureFile } from "../shared/secure-file";
import { PASSWORD_SALT_RE } from "../key-ring/crypto";
import { PROFILE_ID_RE, PROFILE_ID_MESSAGE } from "../agent-intent/profile-format";
import { withFileLock } from "../shared/file-lock";

export const APP_NAME = "ledger-wallet-cli";
const SESSION_FILE = "session.yaml";

const SessionEntrySchema = z.object({
  label: z
    .string()
    .min(1)
    .regex(/^[A-Za-z0-9_-]+$/, "Session label must not contain ':' or other special characters"),
  descriptor: z.string(),
});

const TrustchainMetaSchema = z.object({
  rootId: z.string(),
  applicationPath: z.string(),
});

const DomainEntrySchema = z.object({
  domain: z.string(),
  firstUsed: z.string(),
});

// `satisfies readonly AgentIntentEnvironment[]` only proves every listed value belongs to the
// union — it does NOT prove the union has no further members, so it would not catch the SDK adding
// a third environment. The assertion below checks that missing direction: it fails to compile if
// `AgentIntentEnvironment` ever includes a value this array doesn't list, instead of silently
// dropping any profile already persisted with that value on next session load (see
// `ringFields.agentIntentProfiles`'s `.catch(() => [])` below).
export const AGENT_INTENT_ENVIRONMENTS = ["staging", "production"] as const;
// Type-only assignability check, no runtime footprint: `AssertTrue<T>` only accepts `true` itself,
// so this fails to compile unless every branch of the distributed conditional resolves to `true` —
// i.e. unless every member of `AgentIntentEnvironment` is one this array lists.
type AssertTrue<T extends true> = T;
type _AgentIntentEnvironmentsExhaustive = AssertTrue<
  AgentIntentEnvironment extends (typeof AGENT_INTENT_ENVIRONMENTS)[number] ? true : false
>;

// Non-secret Agent Intent profile metadata only. The profile's private key never lives here — it
// is stored in the OS keychain, keyed by `profileId` (see `key-ring/agent-intent-keychain.ts`).
const AgentIntentProfileSchema = z.object({
  profileId: z.string().regex(PROFILE_ID_RE, PROFILE_ID_MESSAGE),
  displayName: z.string().min(1).max(80),
  description: z.string().min(1).max(280),
  source: z.enum(SUPPORTED_AGENT_SOURCES),
  environment: z.enum(AGENT_INTENT_ENVIRONMENTS),
  bffBaseUrl: z.string(),
  // SEC1-prefixed: 02/03 + 32-byte x-coordinate (compressed) or 04 + 64-byte x/y (uncompressed) —
  // not just any 66/130-char hex string, matching what secp256k1.getPublicKey() actually produces.
  publicKey: z.string().regex(/^0[23][0-9a-f]{64}$|^04[0-9a-f]{128}$/i),
  trustchainId: z.string().optional(),
  // Signed into the enrollment request and enforced by the frontend — persisted so `list`/`show`
  // can report "expired" instead of leaving a dead link marked `pending` forever.
  enrollmentExpiresAt: z.string(),
  createdAt: z.string(),
});

// Ring fields, defined once. Each `.catch`es to a default so one corrupt field never throws the
// whole parse (which would brick every command and could orphan the keychain key on reset).
// `domains` uses a factory `() => []`, not a literal `[]`: Zod reuses one literal instance across
// parses, and trackDomain mutates it in place, which would bleed domains between sessions. Its
// preprocess drops only malformed entries, not the whole list. `accounts` stays strict below.
const ringFields = {
  trustchain: TrustchainMetaSchema.optional().catch(undefined),
  domains: z
    .preprocess(
      v => (Array.isArray(v) ? v.filter(e => DomainEntrySchema.safeParse(e).success) : []),
      z.array(DomainEntrySchema),
    )
    .catch(() => []),
  passwordSalt: z.string().regex(PASSWORD_SALT_RE).optional().catch(undefined),
  agentIntentProfiles: z
    .preprocess(
      v => (Array.isArray(v) ? v.filter(e => AgentIntentProfileSchema.safeParse(e).success) : []),
      z.array(AgentIntentProfileSchema),
    )
    .catch(() => []),
};

/**
 * Best-effort `profileId`s of `agentIntentProfiles` entries that failed schema validation and were
 * dropped by the preprocess above — e.g. a hand-edited field, or one a future schema change tightens
 * against an already-persisted value. Dropping is silent at the schema layer (by design, so one bad
 * entry never bricks every command); this is how a caller surfaces it instead of the profile just
 * vanishing without a trace on the next command that happens to call `write()` (see `agent-intent
 * list`'s use of this).
 */
function invalidAgentIntentProfileIds(root: unknown): string[] {
  const raw =
    typeof root === "object" && root !== null
      ? (root as { agentIntentProfiles?: unknown }).agentIntentProfiles
      : undefined;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(e => !AgentIntentProfileSchema.safeParse(e).success)
    .map(e =>
      typeof e === "object" && e !== null ? (e as { profileId?: unknown }).profileId : undefined,
    )
    .filter((id): id is string => typeof id === "string");
}

const SessionDataSchema = z.object({
  accounts: z.array(SessionEntrySchema).default(() => []),
  ...ringFields,
});

// Same ring fields, without the strict `accounts` — used by `session reset` to salvage ring state
// from an otherwise-corrupt (but object-shaped) file.
const RingFieldsSalvageSchema = z.object(ringFields);

export type SessionEntry = z.infer<typeof SessionEntrySchema>;
export type TrustchainMeta = z.infer<typeof TrustchainMetaSchema>;
export type DomainEntry = z.infer<typeof DomainEntrySchema>;
export type AgentIntentProfileMeta = z.infer<typeof AgentIntentProfileSchema>;

export function getSessionPath(): string {
  return join(stateDir(APP_NAME), SESSION_FILE);
}

function getSessionLockPath(): string {
  return join(stateDir(APP_NAME), ".session.lock");
}

/**
 * Serializes a read-modify-write against `session.yaml` across every command that does one —
 * `enroll`/`complete`/`reset`/`account discover`/`ring init`/`ring destroy`/`ring encrypt`/
 * `ring decrypt` all route through this rather than locking their own scope, so none of them can
 * silently overwrite another's write (`Session.write()` replaces the whole file). Computed lazily
 * (not a module-level constant) so it always reflects the current `stateDir()`, including inside
 * tests that set `XDG_STATE_HOME`/`LOCALAPPDATA` per-case. Also ensures the state directory exists
 * first: on a machine that has never written a session, `stateDir()` returns a path nothing has
 * created yet, and the lock file's own `open()` would otherwise fail with `ENOENT`.
 */
export async function withSessionLock<T>(fn: () => Promise<T> | T): Promise<T> {
  const dir = stateDir(APP_NAME);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  return withFileLock(getSessionLockPath(), fn);
}

/**
 * Construct a Trustchain from persisted metadata. walletSyncEncryptionKey is empty (never persisted);
 * callers needing the real key must restoreTrustchain first — the empty key is only safe as its input.
 */
export function trustchainFromMeta(meta: TrustchainMeta): Trustchain {
  return { ...meta, walletSyncEncryptionKey: "" };
}

type ParsedSessionData = {
  data: z.infer<typeof SessionDataSchema>;
  invalidAgentIntentProfileIds: string[];
};

function parseSessionData(raw: string): ParsedSessionData {
  let root: unknown;
  try {
    root = YAML.parse(raw) ?? {};
    return {
      data: SessionDataSchema.parse(root),
      invalidAgentIntentProfileIds: invalidAgentIntentProfileIds(root),
    };
  } catch {
    throw new Error(
      `Invalid session file at ${getSessionPath()}. Run \`wallet-cli session reset\` to clear it.`,
    );
  }
}

async function readSessionContent(): Promise<string | null> {
  try {
    return await Bun.file(getSessionPath()).text();
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return null;
    throw err;
  }
}

async function readData(): Promise<ParsedSessionData> {
  const content = await readSessionContent();
  return content === null
    ? { data: SessionDataSchema.parse({}), invalidAgentIntentProfileIds: [] }
    : parseSessionData(content);
}

function writeSessionData(data: Record<string, unknown>): void {
  const dir = stateDir(APP_NAME);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700); // enforce on existing dirs created by prior versions
  writeSecureFile(getSessionPath(), Buffer.from(YAML.stringify(data)));
}

function derivationLabel(path: string): string {
  const m = /^m\/(\d+)[h']/.exec(path);
  if (!m) return "unknown";
  switch (Number.parseInt(m[1], 10)) {
    case 44:
      return "legacy";
    case 49:
      return "segwit";
    case 84:
      return "native";
    case 86:
      return "taproot";
    default:
      return `p${m[1]}`;
  }
}

export function generateLabel(
  descriptor: AccountDescriptorV1,
  existingLabels: Set<string>,
): string {
  const { network } = descriptor;
  const parts = [network.name];
  if (network.name === "bitcoin") parts.push(derivationLabel(descriptor.path));
  if (network.env !== "main") parts.push(network.env);
  const base = parts.join("-");
  for (let n = 1; ; n++) {
    const candidate = `${base}-${n}`;
    if (!existingLabels.has(candidate)) return candidate;
  }
}

export class Session {
  private constructor(
    private entries: SessionEntry[],
    private _trustchain: TrustchainMeta | undefined,
    private _domains: DomainEntry[],
    private _passwordSalt: string | undefined,
    private _agentIntentProfiles: AgentIntentProfileMeta[],
    private readonly _invalidAgentIntentProfileIds: string[] = [],
  ) {}

  static async read(): Promise<Session> {
    const { data, invalidAgentIntentProfileIds } = await readData();
    return Session.fromData(data, invalidAgentIntentProfileIds);
  }

  private static fromData(
    data: z.infer<typeof SessionDataSchema>,
    invalidAgentIntentProfileIds: string[] = [],
  ): Session {
    return new Session(
      data.accounts,
      data.trustchain,
      data.domains,
      data.passwordSalt,
      data.agentIntentProfiles,
      invalidAgentIntentProfileIds,
    );
  }

  /**
   * Build an account-only session. WARNING: it has no ring state, so `write()` wipes any
   * trustchain/domains/passwordSalt/agentIntentProfiles on disk. To reset accounts while keeping
   * that state, go through `read()`/`readForReset()` then `clear()`.
   */
  static from(entries: SessionEntry[]): Session {
    return new Session([...entries], undefined, [], undefined, []);
  }

  /**
   * Read the session for `session reset`. On a strict-parse failure the ring fields are salvaged
   * (RingFieldsSalvageSchema) so clearing accounts never wipes the trustchain and orphans the
   * keychain key. Throws only when the file cannot be read or is not valid YAML.
   */
  static async readForReset(): Promise<Session> {
    const content = await readSessionContent();
    if (content === null) return Session.from([]);
    const raw = YAML.parse(content) ?? {}; // invalid YAML propagates to the caller
    const strict = SessionDataSchema.safeParse(raw);
    if (strict.success) return Session.fromData(strict.data, invalidAgentIntentProfileIds(raw));
    // Corrupt-but-parseable file: keep the individually-valid ring fields, drop accounts. A
    // non-object root (bare scalar/array) salvages nothing.
    const root = typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const ring = RingFieldsSalvageSchema.parse(root);
    return new Session(
      [],
      ring.trustchain,
      ring.domains,
      ring.passwordSalt,
      ring.agentIntentProfiles,
      invalidAgentIntentProfileIds(root),
    );
  }

  get accounts(): ReadonlyArray<SessionEntry> {
    return this.entries;
  }

  /**
   * `profileId`s of `agentIntentProfiles` entries the last read dropped for failing schema
   * validation — recoverable enough to name, not enough to load. See `agent-intent list`'s use of
   * this: each id's OS-keychain secret (if any) is now orphaned, since nothing else records it.
   */
  get invalidAgentIntentProfileIds(): ReadonlyArray<string> {
    return this._invalidAgentIntentProfileIds;
  }

  get trustchain(): TrustchainMeta | undefined {
    return this._trustchain;
  }

  get passwordSalt(): string | undefined {
    return this._passwordSalt;
  }

  setPasswordSalt(salt: string): void {
    this._passwordSalt = salt;
  }

  setTrustchain(t: TrustchainMeta): void {
    this._trustchain = t;
  }

  get domains(): ReadonlyArray<DomainEntry> {
    return this._domains;
  }

  /** Records a first-use timestamp for a domain. Returns true only if it was newly added. */
  trackDomain(domain: string): boolean {
    if (this._domains.some(d => d.domain === domain)) return false;
    this._domains.push({ domain, firstUsed: new Date().toISOString() });
    return true;
  }

  /** Clears Ledger Key Ring state (trustchain, tracked keys, password salt). Keeps discovered accounts. */
  wipeRing(): void {
    this._trustchain = undefined;
    this._domains = [];
    this._passwordSalt = undefined;
  }

  get agentIntentProfiles(): ReadonlyArray<AgentIntentProfileMeta> {
    return this._agentIntentProfiles;
  }

  getAgentIntentProfile(profileId: string): AgentIntentProfileMeta | undefined {
    return this._agentIntentProfiles.find(p => p.profileId === profileId);
  }

  /** Throws if `profileId` is already recorded — enrollment must never silently overwrite a profile. */
  addAgentIntentProfile(profile: AgentIntentProfileMeta): void {
    if (this.getAgentIntentProfile(profile.profileId)) {
      throw new Error(`Agent Intent profile "${profile.profileId}" already exists.`);
    }
    this._agentIntentProfiles.push(profile);
  }

  /** Merge a partial update (e.g. setting `trustchainId` after `complete`) into an existing profile. */
  updateAgentIntentProfile(
    profileId: string,
    patch: Partial<Omit<AgentIntentProfileMeta, "profileId">>,
  ): AgentIntentProfileMeta {
    const index = this._agentIntentProfiles.findIndex(p => p.profileId === profileId);
    if (index === -1) throw new Error(`No Agent Intent profile named "${profileId}".`);
    const updated = { ...this._agentIntentProfiles[index], ...patch };
    this._agentIntentProfiles[index] = updated;
    return updated;
  }

  clear(): number {
    const count = this.entries.length;
    this.entries = [];
    return count;
  }

  /**
   * Add (or look up) a single descriptor. Returns the assigned label and whether a new entry
   * was appended. Used to attach labels at discovery time before the session is persisted.
   */
  addDescriptor(descriptor: AccountDescriptorV1): { label: string; added: boolean } {
    const serialized = serializeV1(descriptor);
    const existing = this.entries.find(e => e.descriptor === serialized);
    if (existing) return { label: existing.label, added: false };
    const knownLabels = new Set(this.entries.map(e => e.label));
    const label = generateLabel(descriptor, knownLabels);
    this.entries.push({ label, descriptor: serialized });
    return { label, added: true };
  }

  /** Merge new descriptors in-place. Returns count of newly added entries. */
  addDescriptors(descriptors: AccountDescriptorV1[]): number {
    let added = 0;
    for (const d of descriptors) {
      if (this.addDescriptor(d).added) added++;
    }
    return added;
  }

  write(): void {
    const data: Record<string, unknown> = { accounts: this.entries };
    if (this._trustchain) data.trustchain = this._trustchain;
    if (this._domains.length > 0) data.domains = this._domains;
    if (this._passwordSalt) data.passwordSalt = this._passwordSalt;
    if (this._agentIntentProfiles.length > 0) data.agentIntentProfiles = this._agentIntentProfiles;
    writeSessionData(data);
  }
}
