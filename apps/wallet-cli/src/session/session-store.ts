import { YAML } from "bun";
import { stateDir } from "@bunli/utils";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { z } from "zod";
import type { Trustchain } from "@ledgerhq/ledger-key-ring-protocol/types";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";
import { serializeV1 } from "../shared/accountDescriptor";

export const APP_NAME = "ledger-wallet-cli";
const SESSION_FILE = "session.yaml";

const SessionEntrySchema = z.object({
  label: z.string(),
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
  private _dirty = false;

  private constructor(
    private entries: SessionEntry[],
    private _trustchain: TrustchainMeta | undefined,
    private _domains: DomainEntry[],
  ) {}

  static async read(): Promise<Session> {
    const data = await readData();
    return new Session(data.accounts, data.trustchain, data.domains);
  }

  static from(entries: SessionEntry[]): Session {
    return new Session([...entries], undefined, []);
  }

  get accounts(): ReadonlyArray<SessionEntry> {
    return this.entries;
  }

  get trustchain(): TrustchainMeta | undefined {
    return this._trustchain;
  }

  setTrustchain(t: TrustchainMeta): void {
    this._trustchain = t;
    this._dirty = true;
  }

  get domains(): ReadonlyArray<DomainEntry> {
    return this._domains;
  }

  trackDomain(domain: string): void {
    if (!this._domains.some(d => d.domain === domain)) {
      this._domains.push({ domain, firstUsed: new Date().toISOString() });
      this._dirty = true;
    }
  }

  /** Clears trustchain and domain tracking, but keeps discovered accounts. */
  wipeSecrets(): void {
    this._trustchain = undefined;
    this._domains = [];
    this._dirty = true;
  }

  clear(): number {
    const count = this.entries.length;
    this.entries = [];
    this._dirty = true;
    return count;
  }

  addDescriptors(descriptors: AccountDescriptorV1[]): number {
    const knownDescriptors = new Set(this.entries.map(e => e.descriptor));
    const knownLabels = new Set(this.entries.map(e => e.label));
    let added = 0;
    for (const d of descriptors) {
      const serialized = serializeV1(d);
      if (knownDescriptors.has(serialized)) continue;
      const label = generateLabel(d, knownLabels);
      knownLabels.add(label);
      knownDescriptors.add(serialized);
      this.entries.push({ label, descriptor: serialized });
      added++;
    }
    if (added > 0) this._dirty = true;
    return added;
  }

  async write(): Promise<void> {
    if (!this._dirty) return;
    const dir = stateDir(APP_NAME);
    mkdirSync(dir, { recursive: true });
    const data: Record<string, unknown> = { accounts: this.entries };
    if (this._trustchain) data.trustchain = this._trustchain;
    if (this._domains.length > 0) data.domains = this._domains;
    await Bun.write(getSessionPath(), YAML.stringify(data));
    this._dirty = false;
  }
}
