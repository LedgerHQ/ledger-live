import {
  AGENT_INTENT_STATUSES,
  isAgentIntentStatus,
  isSendOperation,
  isSwapOperation,
  type AgentIntentRecord,
  type AgentIntentSendOperation,
  type AgentIntentStatus,
  type AgentIntentSwapOperation,
} from "@ledgerhq/agent-intent-sdk";
import { stripControlChars } from "../shared/ui";
import { formatBaseUnits } from "./evm";
import {
  findEthereumSwapAsset,
  findEthereumToken,
  findSolanaToken,
  type EthereumToken,
  type SolanaToken,
  type SwapAsset,
} from "./token-lookup";

/** One listed intent as `agent-intent intents` reports it. Field set and names are stable. */
export type IntentListEntry = {
  id: string;
  status: string;
  type: string;
  network: string | null;
  sender: string | null;
  recipient: string | null;
  /** A send's exact base-unit decimal string; `null` for other intent types. */
  amount: string | null;
  /** A send's `amount` in its asset's unit (e.g. "0.01 ETH") when the asset is known, or a swap's
   * pair (e.g. "0.5 ETH → 1250 USDC"). */
  displayAmount: string | null;
  asset: { type: string; assetReference: string | null } | null;
  feeStrategy: string | null;
  /** A Solana send's on-chain memo. */
  memo: string | null;
  /** A swap as signed, with human-unit amounts; `null` for other intent types. */
  swap: {
    fromAsset: string;
    toAsset: string;
    fromAmount: string;
    toAmount: string;
    provider: string;
  } | null;
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
const TERMINAL_STATUSES: ReadonlySet<AgentIntentStatus> = new Set([
  "success",
  "failed",
  "rejected",
  "cancelled",
  "expired",
]);

/**
 * Whether `status` is final, for shell polling: `null` for a state this wallet-cli version doesn't
 * know (a newer service), so callers neither stop nor loop forever on a guess.
 */
export function isTerminalIntentStatus(status: string): boolean | null {
  if (!isAgentIntentStatus(status)) return null;
  return TERMINAL_STATUSES.has(status);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Validates `--intent` before any sign-in: the service only issues UUID intent ids. */
export function parseIntentId(value: string): string {
  const id = value.trim();
  if (!UUID_RE.test(id)) {
    const printable = stripControlChars(value);
    const shown = printable.length > 64 ? `${printable.slice(0, 64)}…` : printable;
    throw new Error(
      `--intent "${shown}" is not an intent id (a UUID such as 0192f7a4-…). Copy it from ` +
        "`agent-intent intents` or from the `agent-intent send` output.",
    );
  }
  return id.toLowerCase();
}

function text(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

/** Names an asset in its own unit; each lookup resolves `null` for an asset it doesn't know. */
export type AssetLookups = {
  ethereumToken: (contract: string) => Promise<EthereumToken | null>;
  solanaToken: (mint: string) => Promise<SolanaToken | null>;
  swapAsset: (id: string) => Promise<SwapAsset | null>;
};

// Read at call time, so a test's module mock of token-lookup applies.
const CAL_LOOKUPS: AssetLookups = {
  ethereumToken: contract => findEthereumToken(contract),
  solanaToken: mint => findSolanaToken(mint),
  swapAsset: id => findEthereumSwapAsset(id),
};

const NATIVE_ASSETS: Record<string, { ticker: string; decimals: number }> = {
  ethereum: { ticker: "ETH", decimals: 18 },
  solana: { ticker: "SOL", decimals: 9 },
};

/** Each asset is looked up once per call, and a failed lookup counts as unknown. */
function memo<T>(lookup: (key: string) => Promise<T | null>): (key: string) => Promise<T | null> {
  const results = new Map<string, Promise<T | null>>();
  return key => {
    if (!results.has(key))
      results.set(
        key,
        lookup(key).catch(() => null),
      );
    return results.get(key)!;
  };
}

function cached(lookups: AssetLookups): AssetLookups {
  return {
    ethereumToken: memo(lookups.ethereumToken),
    solanaToken: memo(lookups.solanaToken),
    swapAsset: memo(lookups.swapAsset),
  };
}

/**
 * Converts listed records to stable entries. A send's amount is shown in its asset's unit when the
 * asset is known (native ETH or SOL, or a token CAL knows), a swap's as its pair; anything else
 * keeps only the exact fields the service returned.
 */
export async function toIntentListEntries(
  records: readonly AgentIntentRecord[],
  lookups: AssetLookups = CAL_LOOKUPS,
): Promise<IntentListEntry[]> {
  const known = cached(lookups);
  return Promise.all(records.map(record => toEntry(record, known)));
}

/** Like {@link toIntentListEntries}, for a single intent. */
export async function toIntentListEntry(
  record: AgentIntentRecord,
  lookups: AssetLookups = CAL_LOOKUPS,
): Promise<IntentListEntry> {
  return toEntry(record, cached(lookups));
}

async function toEntry(
  { id, status, intent, createdAt, updatedAt, failureReason }: AgentIntentRecord,
  lookups: AssetLookups,
): Promise<IntentListEntry> {
  const send = isSendOperation(intent) ? intent : null;
  const swap = isSwapOperation(intent) ? intent : null;
  let displayAmount: string | null = null;
  if (send) displayAmount = await sendDisplayAmount(send, lookups);
  else if (swap) displayAmount = await swapDisplayAmount(swap, lookups);
  return {
    id,
    status,
    type: intent.type,
    network: text(intent.network),
    sender: text(intent.sender),
    recipient: send?.recipient ?? null,
    amount: send?.amount ?? null,
    displayAmount,
    asset: send
      ? { type: send.asset.type, assetReference: send.asset.assetReference ?? null }
      : null,
    feeStrategy: send?.feeStrategy ?? null,
    memo: send?.memo ?? null,
    swap: swap
      ? {
          fromAsset: swap.fromAsset,
          toAsset: swap.toAsset,
          fromAmount: swap.fromAmount,
          toAmount: swap.toAmount,
          provider: swap.provider,
        }
      : null,
    description: text(intent.description),
    failureReason: failureReason ?? null,
    createdAt,
    updatedAt,
  };
}

async function sendDisplayAmount(
  send: AgentIntentSendOperation,
  lookups: AssetLookups,
): Promise<string | null> {
  // BigInt would throw on a malformed amount and fail the whole page, or read hex.
  if (!/^\d+$/.test(send.amount)) return null;
  const unit = await sendUnit(send, lookups);
  return unit ? `${formatBaseUnits(send.amount, unit.decimals)} ${unit.ticker}` : null;
}

async function sendUnit(
  { network, asset }: AgentIntentSendOperation,
  lookups: AssetLookups,
): Promise<{ ticker: string; decimals: number } | null> {
  if (asset.type === "native") return NATIVE_ASSETS[network] ?? null;
  if (!asset.assetReference) return null;
  if (network === "ethereum") return lookups.ethereumToken(asset.assetReference);
  if (network === "solana" && asset.type === "spl-token") {
    return lookups.solanaToken(asset.assetReference);
  }
  return null;
}

/** Swap amounts are already in human units; an asset CAL doesn't know keeps its id. */
async function swapDisplayAmount(
  swap: AgentIntentSwapOperation,
  lookups: AssetLookups,
): Promise<string> {
  const [from, to] = await Promise.all([
    lookups.swapAsset(swap.fromAsset),
    lookups.swapAsset(swap.toAsset),
  ]);
  return (
    `${swap.fromAmount} ${from?.ticker ?? swap.fromAsset} → ` +
    `${swap.toAmount} ${to?.ticker ?? swap.toAsset}`
  );
}
