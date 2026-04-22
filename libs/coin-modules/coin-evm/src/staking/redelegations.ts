import { ethers } from "ethers";
import network from "@ledgerhq/live-network";
import { BigNumber } from "bignumber.js";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation } from "@ledgerhq/types-live";
import type { RedelegationStrategy, StakingRedelegation } from "../types/staking";
import { STAKING_CONTRACTS } from "./contracts";
import { getStakingABI } from "./abis";
import { getCoinConfig } from "../config";
import { withApi } from "../network/node/rpc.common";
import { isExternalNodeConfig } from "../network/node/types";

// ─── Minimal bech32 encoder (BIP-173) ─────────────────────────────────────────
// Used to convert a 20-byte EVM address into a Cosmos bech32 address (e.g. sei1…)
// without pulling in an external dependency.

const BECH32_CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BECH32_GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function bech32Polymod(values: number[]): number {
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) {
      if ((top >> i) & 1) chk ^= BECH32_GENERATOR[i];
    }
  }
  return chk;
}

function bech32HrpExpand(hrp: string): number[] {
  const ret: number[] = [];
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.codePointAt(i)! >> 5);
  ret.push(0);
  for (let i = 0; i < hrp.length; i++) ret.push(hrp.codePointAt(i)! & 31);
  return ret;
}

function bech32CreateChecksum(hrp: string, data: number[]): number[] {
  const values = [...bech32HrpExpand(hrp), ...data, 0, 0, 0, 0, 0, 0];
  const mod = bech32Polymod(values) ^ 1;
  return Array.from({ length: 6 }, (_, p) => (mod >> (5 * (5 - p))) & 31);
}

/** Convert a byte array from 8-bit groups to 5-bit groups (with padding). */
function convertBits8to5(data: Uint8Array): number[] {
  let acc = 0;
  let bits = 0;
  const result: number[] = [];
  for (const byte of data) {
    acc = (acc << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result.push((acc >> bits) & 0x1f);
    }
  }
  if (bits > 0) result.push((acc << (5 - bits)) & 0x1f);
  return result;
}

/**
 * Convert a 20-byte EVM hex address to a Cosmos bech32 address with the given
 * human-readable part (e.g. "sei" → "sei1…").
 */
export function evmAddressToCosmos(evmAddress: string, hrp: string): string {
  const bytes = Buffer.from(evmAddress.replace(/^0x/i, ""), "hex");
  const data = convertBits8to5(bytes);
  const checksum = bech32CreateChecksum(hrp, data);
  return `${hrp}1${[...data, ...checksum].map(x => BECH32_CHARSET[x]).join("")}`;
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
 * The EVM address is converted to a Cosmos bech32 address using the `hrp` field
 * from the strategy config before being embedded in the endpoint URL template.
 */
async function fetchCosmosRestRedelegations(
  baseUrl: string,
  strategy: Extract<RedelegationStrategy, { type: "cosmos-rest" }>,
  evmAddress: string,
): Promise<StakingRedelegation[]> {
  const cosmosAddress = evmAddressToCosmos(evmAddress, strategy.hrp);
  const url = `${baseUrl.replace(/\/$/, "")}${strategy.endpoint.replace("{address}", cosmosAddress)}`;

  let data: CosmosRedelegationsApiResponse | undefined;
  try {
    const res = await network<CosmosRedelegationsApiResponse>({ url, method: "GET" });
    data = res.data;
  } catch {
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

      // Amount is in usei (6 decimals). Convert to EVM units (18 decimals) to
      // stay consistent with how delegation amounts are stored in stakingResources.
      const amountUsei = BigInt(entry.balance);
      const amountWei = amountUsei * 1_000_000_000_000n;

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
    case "cosmos-rest":
      if (!config.apiConfig?.baseUrl) return [];
      return fetchCosmosRestRedelegations(config.apiConfig.baseUrl, strategy, evmAddress);
    // Future strategies (e.g. "native-rpc", "graphql", …) go here.
  }
}

// ─── Operation-derived redelegations ──────────────────────────────────────────

/** Type predicate: narrows `unknown` to a plain object record without a cast. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Fetch raw EVM transaction calldata (the `input` / `data` field) for a given
 * tx hash directly from the RPC node.  Returns `undefined` when the node is not
 * configured or the call fails.
 */
async function fetchTxDataFromRpc(
  currency: CryptoCurrency,
  txHash: string,
): Promise<string | undefined> {
  try {
    const node = getCoinConfig(currency.id).info.node;
    if (!isExternalNodeConfig(node)) return undefined;
    return await withApi(
      currency,
      async provider => {
        const tx = await provider.getTransaction(txHash);
        // tx.data is the hex-encoded calldata (ABI-encoded function call)
        return tx?.data && tx.data !== "0x" ? tx.data : undefined;
      },
      node,
    );
  } catch {
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
    const amountBigInt = typeof rawAmount === "bigint" ? rawAmount : BigInt(String(rawAmount ?? 0));
    const scale = config.calldataAmountScale ?? 1n;
    return {
      srcValidatorAddress: String(src),
      dstValidatorAddress: String(dst),
      amount: new BigNumber((amountBigInt * scale).toString()),
    };
  } catch {
    return null;
  }
}

/**
 * Resolve the validator address for a single DELEGATE or UNDELEGATE operation.
 *
 * The validator address is the first ABI argument for both operations.
 * Follows the same payload-resolution strategy as `resolveRedelegationValidators`:
 * cached `contractPayload` first, then RPC fallback.
 *
 * Returns `null` when the payload cannot be obtained or decoded.
 */
export async function resolveStakingValidator(
  currency: CryptoCurrency,
  operation: Operation,
  operationType: "delegate" | "undelegate",
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
    const [validatorAddress, rawAmount] = d;
    const scale = config.calldataAmountScale ?? 1n;
    const amount =
      rawAmount !== undefined
        ? new BigNumber(
            (
              (typeof rawAmount === "bigint" ? rawAmount : BigInt(String(rawAmount))) * scale
            ).toString(),
          )
        : null;
    return { validatorAddress: String(validatorAddress), amount };
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
  const redelegations: StakingRedelegation[] = [];

  for (const op of operations) {
    if (op.type !== "REDELEGATE") continue;
    // Operation.date is always a Date object (not a raw string).
    const completionDate = new Date(op.date.getTime() + unbondingMs);

    if (op.hasFailed) continue;
    if (completionDate <= now) continue;

    // Use cached calldata when available; otherwise fetch from the RPC node.
    const extra = isRecord(op.extra) ? op.extra : undefined;
    const cached = extra?.contractPayload;
    let payload = typeof cached === "string" ? cached : undefined;
    if (!payload) {
      payload = await fetchTxDataFromRpc(currency, op.hash);
    }

    if (!payload) continue;

    try {
      const d = iface.decodeFunctionData(functionName, payload);
      const [srcAddress, dstAddress, rawAmount] = d;
      const amountBigInt = typeof rawAmount === "bigint" ? rawAmount : BigInt(String(rawAmount));
      const scale = config.calldataAmountScale ?? 1n;
      redelegations.push({
        validatorSrcAddress: String(srcAddress),
        validatorDstAddress: String(dstAddress),
        amount: new BigNumber((amountBigInt * scale).toString()),
        completionDate,
      });
    } catch {
      // skip ops with malformed payload
    }
  }

  return redelegations;
}
