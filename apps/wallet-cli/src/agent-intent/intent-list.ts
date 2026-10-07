import {
  AGENT_INTENT_STATUSES,
  isAgentIntentStatus,
  type AgentIntentRecord,
  type AgentIntentStatus,
} from "@ledgerhq/agent-intent-sdk";
import { formatBaseUnits } from "./evm";
import type { EthereumToken } from "./token-lookup";

const ETH_DECIMALS = 18;

/** One listed intent as `agent-intent intents` reports it. Field set and names are stable. */
export type IntentListEntry = {
  id: string;
  status: string;
  type: string;
  network: string | null;
  sender: string | null;
  recipient: string | null;
  /** Exact base-unit decimal string; `null` for intent types without a single amount. */
  amount: string | null;
  /** `amount` in the asset's unit with its ticker (e.g. "0.01 ETH"), when the asset is known. */
  displayAmount: string | null;
  asset: { type: string; assetReference: string | null } | null;
  feeStrategy: string | null;
  description: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Parses `--status` (comma-separated, e.g. "signed,broadcast") into the SDK's lifecycle states. */
export function parseStatusFilter(value: string | undefined): AgentIntentStatus[] | undefined {
  if (value === undefined) return undefined;
  const statuses = value
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
  const unknown = statuses.filter(s => !isAgentIntentStatus(s));
  if (statuses.length === 0 || unknown.length > 0) {
    const offending = unknown.length ? `"${unknown.join(", ")}"` : "value";
    throw new Error(
      `Unknown --status ${offending}. Use one or more of ${AGENT_INTENT_STATUSES.join(", ")}, ` +
        "comma-separated.",
    );
  }
  return [...new Set(statuses)] as AgentIntentStatus[];
}

/** States after which an intent never changes again. */
const TERMINAL_STATUSES: readonly AgentIntentStatus[] = [
  "success",
  "failed",
  "rejected",
  "expired",
];

/**
 * Whether `status` is final, for shell polling: `null` for a state this wallet-cli version doesn't
 * know (a newer service), so callers neither stop nor loop forever on a guess.
 */
export function isTerminalIntentStatus(status: string): boolean | null {
  if (!isAgentIntentStatus(status)) return null;
  return TERMINAL_STATUSES.includes(status);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates `--intent` before any sign-in: the service only issues UUID intent ids. */
export function parseIntentId(value: string): string {
  const id = value.trim();
  if (!UUID_RE.test(id)) {
    throw new Error(
      `--intent "${value}" is not an intent id (a UUID such as 0192f7a4-…). Copy it from ` +
        "`agent-intent intents` or from the `agent-intent send` output.",
    );
  }
  return id.toLowerCase();
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/**
 * Converts listed records to stable entries. ERC-20 amounts on Ethereum are shown in token units
 * when `lookupToken` knows the contract; anything else keeps only the exact base-unit `amount`.
 */
export async function toIntentListEntries(
  records: readonly AgentIntentRecord[],
  lookupToken: (contract: string) => Promise<EthereumToken | null>,
): Promise<IntentListEntry[]> {
  const tokens = new Map<string, Promise<EthereumToken | null>>();
  const token = (contract: string) => {
    const key = contract.toLowerCase();
    if (!tokens.has(key))
      tokens.set(
        key,
        lookupToken(contract).catch(() => null),
      );
    return tokens.get(key)!;
  };

  return Promise.all(records.map(record => toEntry(record, token)));
}

/** Like {@link toIntentListEntries}, for a single intent. */
export async function toIntentListEntry(
  record: AgentIntentRecord,
  lookupToken: (contract: string) => Promise<EthereumToken | null>,
): Promise<IntentListEntry> {
  return toEntry(record, contract => lookupToken(contract).catch(() => null));
}

async function toEntry(
  { id, status, intent, createdAt, updatedAt, failureReason }: AgentIntentRecord,
  token: (contract: string) => Promise<EthereumToken | null>,
): Promise<IntentListEntry> {
  const amount = text(intent.amount);
  const asset = intent.asset
    ? { type: intent.asset.type, assetReference: intent.asset.assetReference ?? null }
    : null;
  let displayAmount: string | null = null;
  if (amount !== null && intent.network === "ethereum" && asset?.type === "native") {
    displayAmount = `${formatBaseUnits(amount, ETH_DECIMALS)} ETH`;
  } else if (amount !== null && intent.network === "ethereum" && asset?.assetReference) {
    const known = await token(asset.assetReference);
    if (known) displayAmount = `${formatBaseUnits(amount, known.decimals)} ${known.ticker}`;
  }
  return {
    id,
    status,
    type: intent.type,
    network: text(intent.network),
    sender: text(intent.sender),
    recipient: text(intent.recipient),
    amount,
    displayAmount,
    asset,
    feeStrategy: text(intent.feeStrategy),
    description: text(intent.description),
    failureReason: failureReason ?? null,
    createdAt,
    updatedAt,
  };
}
