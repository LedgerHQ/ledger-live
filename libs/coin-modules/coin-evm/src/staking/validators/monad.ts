import { ethers, type JsonRpcProvider } from "ethers";
import type { Cursor, Page } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { isExternalNodeConfig } from "../../network/node/types";
import { getStakingABI } from "../abis";
import { STAKING_CONTRACTS } from "../contracts";
import type { ValidatorApi } from "./types";

// Monad staking precompile read functions are marked `nonpayable` (not `view`)
// in the ABI because precompiles can consume all gas on invalid arguments — but
// they are read-only. We bypass ethers' Contract layer and use
// `provider.call({to, data})` directly, mirroring the pattern in fetchers.ts.

// Concurrency cap when fetching per-validator details. Mirrors the rationale in
// fetchers.ts:STAKE_FETCH_BATCH_SIZE — firing all N in parallel can trigger
// node-side rate limiting that surfaces as silent failures.
const DETAILS_BATCH_SIZE = 10;

// Per Monad docs, commission is expressed in 1e18 units (e.g., 10% = 1e17).
// `ethers.formatUnits` converts the bigint to a "0.1" string we then parse, so
// no Number(bigint) precision loss for the 1e18 scale.
const COMMISSION_DECIMALS = 18;

type ValidatorSetRaw = [boolean, bigint, bigint[]];
type ValidatorRaw = [string, unknown, bigint, unknown, bigint];

function isValidatorSetRaw(value: unknown): value is ValidatorSetRaw {
  return (
    Array.isArray(value) &&
    typeof value[0] === "boolean" &&
    typeof value[1] === "bigint" &&
    Array.isArray(value[2]) &&
    value[2].every(item => typeof item === "bigint")
  );
}

function isValidatorRaw(value: unknown): value is ValidatorRaw {
  return (
    Array.isArray(value) &&
    typeof value[0] === "string" &&
    typeof value[2] === "bigint" &&
    typeof value[4] === "bigint"
  );
}

type ResolvedContext = {
  currency: CryptoCurrency;
  abi: ethers.InterfaceAbi;
  node: { type: "external"; uri: string; retries?: number };
  contractAddress: string;
};

const resolveContext = (currencyId: string): ResolvedContext | undefined => {
  const config = STAKING_CONTRACTS[currencyId];
  if (!config) return undefined;

  const abi = getStakingABI(currencyId);
  if (!abi) return undefined;

  const node = getCoinConfig(currencyId).info.node;
  if (!isExternalNodeConfig(node)) return undefined;

  try {
    const currency = getCryptoCurrencyById(currencyId);

    return {
      currency,
      abi: abi as ethers.InterfaceAbi,
      node,
      contractAddress: config.contractAddress,
    };
  } catch {
    return undefined;
  }
};

const fetchValidatorDetails = async (
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  contractAddress: string,
  valIds: bigint[],
): Promise<StakingValidatorItem[]> => {
  const items: StakingValidatorItem[] = [];

  for (let i = 0; i < valIds.length; i += DETAILS_BATCH_SIZE) {
    const chunk = valIds.slice(i, i + DETAILS_BATCH_SIZE);
    const settled = await Promise.allSettled(
      chunk.map(async valId => {
        const data = iface.encodeFunctionData("getValidator", [valId]);
        const raw = await provider.call({ to: contractAddress, data });
        return iface.decodeFunctionResult("getValidator", raw);
      }),
    );

    settled.forEach((res, idx) => {
      if (res.status === "rejected") {
        log("coin-evm/staking", "fetchValidatorDetails: getValidator call failed", {
          valId: chunk[idx].toString(),
          error: res.reason instanceof Error ? res.reason.message : String(res.reason),
        });
        return;
      }

      if (!isValidatorRaw(res.value)) return;

      const tuple = res.value;
      const valId = chunk[idx];
      const [authAddress, _flags, stake, _accRewardPerToken, commission] = tuple;

      items.push({
        // authAddress lets the explorer URL template substitute correctly
        // (https://monadscan.com/address/$address). The uint64→address mapping
        // needed for delegate(uint64) calldata is a separate ticket.
        validatorAddress: authAddress,
        name: `Validator ${valId.toString()}`,
        commission: Number.parseFloat(ethers.formatUnits(commission, COMMISSION_DECIMALS)),
        tokens: Number(stake),
        votingPower: items.length,
        estimatedYearlyRewardsRate: 0,
      });
    });
  }

  return items;
};

const fetchPage = async (
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  contractAddress: string,
  startIndex: bigint,
): Promise<Page<StakingValidatorItem>> => {
  const data = iface.encodeFunctionData("getExecutionValidatorSet", [startIndex]);
  const raw = await provider.call({ to: contractAddress, data });
  const decoded = iface.decodeFunctionResult("getExecutionValidatorSet", raw);

  if (!isValidatorSetRaw(decoded)) return { items: [], next: undefined };

  const [isDone, nextIndex, pageIds] = decoded;
  const items =
    pageIds.length === 0
      ? []
      : await fetchValidatorDetails(provider, iface, contractAddress, pageIds);

  const exhausted = isDone || pageIds.length === 0 || nextIndex <= startIndex;
  return { items, next: exhausted ? undefined : nextIndex.toString() };
};

const fetchValidators = async (
  currencyId: string,
  cursor?: Cursor,
): Promise<Page<StakingValidatorItem>> => {
  const ctx = resolveContext(currencyId);
  if (!ctx) return { items: [], next: undefined };

  try {
    const startIndex = cursor === undefined ? 0n : BigInt(cursor);

    return await withApi(
      ctx.currency,
      async provider => {
        const iface = new ethers.Interface(ctx.abi);
        return fetchPage(provider, iface, ctx.contractAddress, startIndex);
      },
      ctx.node,
    );
  } catch (error) {
    log("coin-evm/staking", "fetchValidators: Monad validators page fetch failed", {
      error: error instanceof Error ? error.message : String(error),
      currencyId,
      cursor,
    });
    return { items: [], next: undefined };
  }
};

export default {
  fetchValidators,
} satisfies ValidatorApi;
