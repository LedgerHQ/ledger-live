import type {
  EstimateFeesOptions,
  FeeEstimation,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { hours, makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { CASPER_FEES_MOTES, LANE_KEYS, LANE_LIMIT_TUPLE_INDEX } from "../constants";
import { fetchChainspecToml } from "../network/api";
import type { CasperConfig, CasperContext } from "../types/config";

const NATIVE_MINT_LANE_PATTERN = new RegExp(
  String.raw`^\s*${LANE_KEYS.nativeMint}\s*=\s*\[([^\]]*)\]`,
  "m",
);

const parseNativeMintLaneLimit = (toml: string): bigint | undefined => {
  const match = NATIVE_MINT_LANE_PATTERN.exec(toml);
  if (!match) return undefined;

  const raw = match[1].split(",")[LANE_LIMIT_TUPLE_INDEX]?.replace(/_/g, "").trim();
  return raw && /^\d+$/.test(raw) ? BigInt(raw) : undefined;
};

// The lane limit only moves on a protocol upgrade, so an hour of staleness is harmless.
// Exported so tests can `.reset()` it. Keyed by the node endpoint so distinct configs don't collide.
export const nativeMintLaneLimitCache = makeLRUCache(
  async (config: CasperConfig): Promise<bigint | undefined> => {
    const limit = parseNativeMintLaneLimit(await fetchChainspecToml(config));
    if (limit === undefined) {
      log("error", `Casper chainspec has no ${LANE_KEYS.nativeMint} gas limit`);
    }

    return limit;
  },
  (config: CasperConfig) => config.infra.API_CASPER_NODE_ENDPOINT,
  hours(1),
);

export const estimateFees = async (
  context: CasperContext,
  transactionIntent: TransactionIntent<MemoNotSupported>,
  _options?: {
    customFeesParameters?: FeeEstimation["parameters"];
    feeOption?: EstimateFeesOptions;
  },
): Promise<FeeEstimation> => {
  if (transactionIntent.intentType === "staking") {
    throw new Error("estimateFees is not supported for staking transactions");
  }
  if (transactionIntent.asset.type !== "native") {
    throw new Error(
      `estimateFees is not supported for asset type "${transactionIntent.asset.type}"`,
    );
  }

  const config = await context.config();
  const limit = await nativeMintLaneLimitCache(config).catch(() => undefined);

  // Never pad this: unspent gas is only 75% refunded, so any safety margin is money burned.
  // https://docs.casper.network/concepts/economics/gas-concepts
  return {
    value: limit ?? BigInt(CASPER_FEES_MOTES),
    parameters: {
      source: limit === undefined ? "fallback" : "chainspec",
      lane: "native_mint",
    },
  };
};

export function getEstimatedFees(): BigNumber {
  return new BigNumber(CASPER_FEES_MOTES);
}
