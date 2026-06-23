import { ethers } from "ethers";
import network from "@ledgerhq/live-network";
import { log } from "@ledgerhq/logs";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, StakingRedelegation } from "@ledgerhq/types-live";
import type { RedelegationStrategy } from "../types/staking";
import { STAKING_CONTRACTS } from "./contracts";
import { getStakingABI } from "./abis";
import { getValidatorAddressById } from "./validators/monad";
import { getCoinConfig } from "../config";
import { withApi } from "../network/node/rpc.common";
import { isExternalNodeConfig } from "../network/node/types";

// ─── Cosmos Address Precompile ─────────────────────────────────────────────────

/**
 * Query a chain's address precompile to obtain the canonical Cosmos bech32
 * address associated with a given EVM address.
 *
 * On Cosmos EVM chains (e.g. Sei), the EVM address and the Cosmos address are
 * both derived from the same secp256k1 public key, but through completely
 * different hash algorithms:
 *   - EVM:    keccak256(pubkey)[−20:]
 *   - Cosmos: RIPEMD160(SHA256(pubkey))
 *
 * These produce different 20-byte values, so bech32-encoding the EVM address
 * bytes directly yields the wrong result.
 * This function queries the authoritative on-chain registry instead.
 *
 * The precompile address and ABI are chain-specific and must be supplied via
 * `apiConfig.precompileAddress` in `contracts.ts`.
 *
 * Returns `null` when the address has not been associated yet or the RPC call
 * fails, allowing callers to fall back gracefully.
 */
export async function getCosmosAddr(
  evmRpcUrl: string,
  precompile: { address: string; abi: string },
  evmAddress: string,
): Promise<string | null> {
  try {
    const provider = new ethers.JsonRpcProvider(evmRpcUrl);
    const contract = new ethers.Contract(precompile.address, [precompile.abi], provider);
    const fn = ethers.FunctionFragment.from(precompile.abi);
    const result: unknown = await contract[fn.name](evmAddress);
    if (typeof result !== "string" || !result) return null;
    return result;
  } catch (e) {
    return null;
  }
}

// ─── Cosmos REST redelegations ─────────────────────────────────────────────────

type CosmosRedelegationEntry = {
  redelegation_entry: {
    completion_time: string;
    initial_balance: string;
  };
  balance: string;
};

type CosmosRedelegationResponse = {
  redelegation: {
    delegator_address: string;
    validator_src_address: string;
    validator_dst_address: string;
  };
  entries: CosmosRedelegationEntry[];
};

type CosmosRedelegationsApiResponse = {
  redelegation_responses: CosmosRedelegationResponse[];
};

/**
 * Fetch active redelegations from the Cosmos REST API for chains that use the
 * standard Cosmos staking module (e.g. Sei EVM via the staking precompile).
 *
 * The EVM address is resolved to its canonical Cosmos bech32 address via the
 * chain's address precompile (configured in `apiConfig.precompileAddress`
 * in `contracts.ts`).  EVM and Cosmos addresses are derived from the same
 * public key through _different_ hash algorithms and therefore encode different
 * bytes — a direct bech32 encoding of the EVM bytes would yield the wrong
 * address.  Returns `[]` when the precompile call fails (e.g. the address has
 * not been associated on-chain yet) or the currency node config /
 * `cosmosAddressPrecompile` are not configured.
 */
async function fetchCosmosRestRedelegations(
  baseUrl: string,
  strategy: Extract<RedelegationStrategy, { type: "cosmos-rest" }>,
  evmAddress: string,
  calldataAmountScale: bigint,
  evmRpcUrl?: string,
  precompileAddress?: { address: string; abi: string },
): Promise<StakingRedelegation[]> {
  if (!evmRpcUrl || !precompileAddress) return [];
  const cosmosAddress = await getCosmosAddr(evmRpcUrl, precompileAddress, evmAddress);
  if (!cosmosAddress) return [];
  const url = `${baseUrl.replace(/\/$/, "")}${strategy.endpoint.replace("{address}", cosmosAddress)}`;

  let data: CosmosRedelegationsApiResponse | undefined;
  try {
    const res = await network<CosmosRedelegationsApiResponse>({ url, method: "GET" });
    data = res.data;
  } catch (e) {
    log("coin-evm/staking", "fetchCosmosRestRedelegations: REST request failed", {
      url,
      error: e instanceof Error ? e.message : String(e),
    });
    return [];
  }

  if (!Array.isArray(data?.redelegation_responses)) return [];

  const now = new Date();
  const redelegations: StakingRedelegation[] = [];
  for (const resp of data.redelegation_responses) {
    const { validator_src_address, validator_dst_address } = resp.redelegation;
    for (const entry of resp.entries ?? []) {
      const completionDate = new Date(entry.redelegation_entry.completion_time);
      if (completionDate <= now) continue; // skip already-completed entries

      // Amount is returned in the chain's Cosmos REST base unit. Convert it using
      // the per-currency staking config so redelegation amounts stay consistent
      // with how delegation amounts are stored in stakingResources.
      const amountUsei = BigInt(entry.balance);
      const amountWei = amountUsei * calldataAmountScale;

      redelegations.push({
        validatorSrcAddress: validator_src_address,
        validatorDstAddress: validator_dst_address,
        amount: new BigNumber(amountWei.toString()),
        completionDate,
      });
    }
  }
  return redelegations;
}

/**
 * Fetch active redelegations for the given EVM address using the chain's
 * configured `redelegationStrategy`.  Returns `[]` when no strategy is
 * configured or the fetch fails (keeps sync non-blocking).
 *
 * To add support for a new chain, implement a new `case` matching its
 * `RedelegationStrategy.type` and add the corresponding entry to
 * `STAKING_CONTRACTS` in `contracts.ts`.
 */
export async function fetchRedelegations(
  currencyId: string,
  evmAddress: string,
): Promise<StakingRedelegation[]> {
  const config = STAKING_CONTRACTS[currencyId];
  const strategy = config?.redelegationStrategy;
  if (!strategy || strategy.type === "none") return [];

  switch (strategy.type) {
    case "cosmos-rest": {
      if (!config.apiConfig?.baseUrl) return [];
      const node = getCoinConfig(currencyId).info.node;
      const evmRpcUrl = isExternalNodeConfig(node) ? node.uri : undefined;
      return fetchCosmosRestRedelegations(
        config.apiConfig.baseUrl,
        strategy,
        evmAddress,
        config.calldataAmountScale ?? 1n,
        evmRpcUrl,
        config.apiConfig.precompileAddress,
      );
    }
    default:
      return [];
  }
}

// ─── Operation-derived redelegations ──────────────────────────────────────────

/** Type predicate: narrows `unknown` to a plain object record without a cast. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Fetch raw EVM transaction calldata for a given tx hash directly via the
 * chain's external RPC node.  Returns `undefined` when the node is not
 * configured as "external", the transaction is not found, or the call fails.
 */
async function fetchTxDataFromRpc(
  currency: CryptoCurrency,
  txHash: string,
): Promise<string | undefined> {
  try {
    const node = getCoinConfig(currency.id).info.node;
    if (!isExternalNodeConfig(node)) return undefined;
    const data = await withApi(
      currency,
      async api => {
        const tx = await api.getTransaction(txHash);
        return tx?.data ?? null;
      },
      node,
    );
    return data && data !== "0x" ? data : undefined;
  } catch (e) {
    log("coin-evm/staking", "fetchTxDataFromRpc: getTransaction failed", {
      currencyId: currency.id,
      txHash,
      error: e instanceof Error ? e.message : String(e),
    });
    return undefined;
  }
}

/**
 * Resolve the src/dst validator addresses for a single REDELEGATE operation.
 *
 * First tries the cached `contractPayload` in `operation.extra`; if absent
 * (e.g. operations synced via the Alpaca bridge which does not store calldata),
 * falls back to fetching the raw transaction input from the EVM RPC node.
 *
 * Returns `null` when the payload cannot be obtained or decoded.
 */
export async function resolveRedelegationValidators(
  currency: CryptoCurrency,
  operation: Operation,
): Promise<{
  srcValidatorAddress: string;
  dstValidatorAddress: string;
  amount: BigNumber;
} | null> {
  const extra = isRecord(operation.extra) ? operation.extra : undefined;
  const cached = extra?.contractPayload;
  const payload =
    typeof cached === "string" ? cached : await fetchTxDataFromRpc(currency, operation.hash);

  if (!payload) return null;

  const config = STAKING_CONTRACTS[currency.id];
  const functionName = config?.functions.redelegate;
  const abi = getStakingABI(currency.id);
  if (!abi || !functionName) return null;
  try {
    const iface = new ethers.Interface(abi);
    const d = iface.decodeFunctionData(functionName, payload);
    const [src, dst, rawAmount] = d;
    if (typeof src !== "string" || typeof dst !== "string") return null;
    const amountBigInt = typeof rawAmount === "bigint" ? rawAmount : BigInt(String(rawAmount ?? 0));
    const scale = config.calldataAmountScale ?? 1n;
    return {
      srcValidatorAddress: src,
      dstValidatorAddress: dst,
      amount: new BigNumber((amountBigInt * scale).toString()),
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the validator address for a single DELEGATE, UNDELEGATE or WITHDRAW operation.
 *
 * The validator address is the first ABI argument for all three operations.
 * Follows the same payload-resolution strategy as `resolveRedelegationValidators`:
 * cached `contractPayload` first, then RPC fallback.
 *
 * NOTE: the returned `amount` is only meaningful for DELEGATE/UNDELEGATE, where the
 * second ABI argument is the staked amount. For WITHDRAW the second argument is a slot
 * identifier (`withdrawId`), not an amount, so callers should rely on `operation.value`.
 *
 * Returns `null` when the payload cannot be obtained or decoded.
 */
export async function resolveStakingValidator(
  currency: CryptoCurrency,
  operation: Operation,
  operationType: "delegate" | "undelegate" | "withdraw",
): Promise<{ validatorAddress: string; amount: BigNumber | null } | null> {
  const extra = isRecord(operation.extra) ? operation.extra : undefined;
  const cached = extra?.contractPayload;
  const payload =
    typeof cached === "string" ? cached : await fetchTxDataFromRpc(currency, operation.hash);

  if (!payload) return null;

  const config = STAKING_CONTRACTS[currency.id];
  const functionName = config?.functions[operationType];
  const abi = getStakingABI(currency.id);
  if (!abi || !functionName) return null;
  try {
    const iface = new ethers.Interface(abi);
    const d = iface.decodeFunctionData(functionName, payload);
    const [first, rawAmount] = d;

    const validatorAddress =
      typeof first === "string"
        ? first
        : typeof first === "bigint"
          ? await getValidatorAddressById(currency.id, first)
          : null;
    if (!validatorAddress) return null;

    const scale = config.calldataAmountScale ?? 1n;
    const amount =
      rawAmount !== undefined
        ? new BigNumber(
            (
              (typeof rawAmount === "bigint" ? rawAmount : BigInt(String(rawAmount))) * scale
            ).toString(),
          )
        : null;
    return { validatorAddress, amount };
  } catch {
    return null;
  }
}

export async function buildRedelegationsFromOps(
  currency: CryptoCurrency,
  operations: Operation[],
): Promise<StakingRedelegation[]> {
  const currencyId = currency.id;
  const config = STAKING_CONTRACTS[currencyId];
  if (!config?.functions.redelegate) return [];

  const abi = getStakingABI(currencyId);
  if (!abi) return [];

  const functionName = config.functions.redelegate;
  const unbondingMs = (config.unbondingPeriodDays ?? 21) * 24 * 60 * 60 * 1000;
  const iface = new ethers.Interface(abi);
  const now = new Date();
  const eligibleOperations = operations.filter(op => {
    if (op.type !== "REDELEGATE") return false;
    if (op.hasFailed) return false;
    const completionDate = new Date(op.date.getTime() + unbondingMs);
    if (completionDate <= now) return false;
    return true;
  });
  const redelegations = await Promise.all(
    eligibleOperations.map(async op => {
      const completionDate = new Date(op.date.getTime() + unbondingMs);
      // Use cached calldata when available; otherwise fetch from the RPC node.
      const extra = isRecord(op.extra) ? op.extra : undefined;
      const cached = extra?.contractPayload;
      const payload =
        typeof cached === "string" ? cached : await fetchTxDataFromRpc(currency, op.hash);
      if (!payload) return null;
      try {
        const d = iface.decodeFunctionData(functionName, payload);
        const [srcAddress, dstAddress, rawAmount] = d;
        if (typeof srcAddress !== "string" || typeof dstAddress !== "string") return null;
        const amountBigInt = typeof rawAmount === "bigint" ? rawAmount : BigInt(String(rawAmount));
        const scale = config.calldataAmountScale ?? 1n;
        return {
          validatorSrcAddress: srcAddress,
          validatorDstAddress: dstAddress,
          amount: new BigNumber((amountBigInt * scale).toString()),
          completionDate,
        } satisfies StakingRedelegation;
      } catch {
        return null;
      }
    }),
  );
  return redelegations.filter(
    (redelegation): redelegation is StakingRedelegation => redelegation !== null,
  );
}
