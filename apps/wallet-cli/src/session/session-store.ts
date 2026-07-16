import { YAML } from "bun";
import { stateDir } from "@bunli/utils";
import { join } from "node:path";
import { chmodSync, mkdirSync } from "node:fs";
import { z } from "zod";
import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";
import { serializeV1 } from "../shared/accountDescriptor";
import { writeSecureFile } from "../shared/secure-file";
import { PASSWORD_SALT_RE } from "../key-ring/crypto";

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
};

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

export function getSessionPath(): string {
  return join(stateDir(APP_NAME), SESSION_FILE);
}

/**
 * Construct a Trustchain from persisted metadata. walletSyncEncryptionKey is empty (never persisted);
 * callers needing the real key must restoreTrustchain first — the empty key is only safe as its input.
 */
export function trustchainFromMeta(meta: TrustchainMeta): Trustchain {
  return { ...meta, walletSyncEncryptionKey: "" };
}

function parseSessionData(raw: string): z.infer<typeof SessionDataSchema> {
  try {
    return SessionDataSchema.parse(YAML.parse(raw) ?? {});
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

async function readData(): Promise<z.infer<typeof SessionDataSchema>> {
  const content = await readSessionContent();
  return content === null ? SessionDataSchema.parse({}) : parseSessionData(content);
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
  ) {}

  static async read(): Promise<Session> {
    return Session.fromData(await readData());
  }

  private static fromData(data: z.infer<typeof SessionDataSchema>): Session {
    return new Session(data.accounts, data.trustchain, data.domains, data.passwordSalt);
  }

  /**
   * Build an account-only session. WARNING: it has no ring state, so `write()` wipes any
   * trustchain/domains/passwordSalt on disk. To reset accounts while keeping the ring, go through
   * `read()`/`readForReset()` then `clear()`.
   */
  static from(entries: SessionEntry[]): Session {
    return new Session([...entries], undefined, [], undefined);
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
    if (strict.success) return Session.fromData(strict.data);
    // Corrupt-but-parseable file: keep the individually-valid ring fields, drop accounts. A
    // non-object root (bare scalar/array) salvages nothing.
    const root = typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const ring = RingFieldsSalvageSchema.parse(root);
    return new Session([], ring.trustchain, ring.domains, ring.passwordSalt);
  }

  get accounts(): ReadonlyArray<SessionEntry> {
    return this.entries;
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
    writeSessionData(data);
  }
}
