import { YAML } from "bun";
import { stateDir } from "@bunli/utils";
import { join } from "node:path";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { z } from "zod";
import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";
import { serializeV1 } from "../shared/accountDescriptor";

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

const SessionDataSchema = z.object({
  accounts: z.array(SessionEntrySchema).default([]),
  trustchain: TrustchainMetaSchema.optional(),
  domains: z.array(DomainEntrySchema).default([]),
  passwordSalt: z.string().optional(),
});

export type SessionEntry = z.infer<typeof SessionEntrySchema>;
export type TrustchainMeta = z.infer<typeof TrustchainMetaSchema>;
export type DomainEntry = z.infer<typeof DomainEntrySchema>;

export function getSessionPath(): string {
  return join(stateDir(APP_NAME), SESSION_FILE);
}

/** Construct a Trustchain from metadata; walletSyncEncryptionKey is left empty (sufficient for auth-only LKRP calls). */
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

async function readData(): Promise<z.infer<typeof SessionDataSchema>> {
  let content: string;
  try {
    content = await Bun.file(getSessionPath()).text();
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT")
      return SessionDataSchema.parse({});
    throw err;
  }
  return parseSessionData(content);
}

function writeSessionData(data: Record<string, unknown>): void {
  const dir = stateDir(APP_NAME);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  const sessionPath = getSessionPath();
  writeFileSync(sessionPath, YAML.stringify(data), { mode: 0o600 });
  chmodSync(sessionPath, 0o600);
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
    const data = await readData();
    return new Session(data.accounts, data.trustchain, data.domains, data.passwordSalt);
  }

  static from(entries: SessionEntry[]): Session {
    return new Session([...entries], undefined, [], undefined);
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

  trackDomain(domain: string): void {
    if (!this._domains.some(d => d.domain === domain)) {
      this._domains.push({ domain, firstUsed: new Date().toISOString() });
    }
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
