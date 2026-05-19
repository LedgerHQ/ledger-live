import { YAML } from "bun";
import { stateDir } from "@bunli/utils";
import { join } from "node:path";
import { chmodSync, mkdirSync, writeFileSync } from "node:fs";
import { z } from "zod";
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

const SessionDataSchema = z.object({
  accounts: z.array(SessionEntrySchema).default([]),
});

export type SessionEntry = z.infer<typeof SessionEntrySchema>;

export function getSessionPath(): string {
  return join(stateDir(APP_NAME), SESSION_FILE);
}

function parseSessionData(raw: string): SessionEntry[] {
  try {
    return SessionDataSchema.parse(YAML.parse(raw) ?? {}).accounts;
  } catch {
    throw new Error(
      `Invalid session file at ${getSessionPath()}. Run \`wallet-cli session reset\` to clear it.`,
    );
  }
}

async function readEntries(): Promise<SessionEntry[]> {
  let content: string;
  try {
    content = await Bun.file(getSessionPath()).text();
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") return [];
    throw err;
  }
  return parseSessionData(content);
}

function writeEntries(entries: SessionEntry[]): void {
  const dir = stateDir(APP_NAME);
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700); // enforce on existing dirs created by prior versions
  const sessionPath = getSessionPath();
  writeFileSync(sessionPath, YAML.stringify({ accounts: entries }), { mode: 0o600 });
  chmodSync(sessionPath, 0o600); // enforce on existing files created by prior versions
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
  private constructor(private entries: SessionEntry[]) {}

  static async read(): Promise<Session> {
    return new Session(await readEntries());
  }

  static from(entries: SessionEntry[]): Session {
    return new Session([...entries]);
  }

  get accounts(): ReadonlyArray<SessionEntry> {
    return this.entries;
  }

  /** Remove all entries. Returns count of entries that were present. */
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
    writeEntries(this.entries);
  }
}
