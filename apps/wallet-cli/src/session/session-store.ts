import { YAML } from "bun";
import { stateDir } from "@bunli/utils";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { z } from "zod";
import type { AccountDescriptorV1 } from "../shared/accountDescriptor";
import { serializeV1 } from "../shared/accountDescriptor";

export const APP_NAME = "ledger-wallet-cli";
const SESSION_FILE = "session.yaml";

const SessionEntrySchema = z.object({
  label: z.string(),
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

async function writeEntries(entries: SessionEntry[]): Promise<void> {
  const dir = stateDir(APP_NAME);
  mkdirSync(dir, { recursive: true });
  await Bun.write(getSessionPath(), YAML.stringify({ accounts: entries }));
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

  /** Merge new descriptors in-place. Returns count of newly added entries. */
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
    return added;
  }

  async write(): Promise<void> {
    await writeEntries(this.entries);
  }
}
