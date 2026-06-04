import { ethers, type JsonRpcProvider } from "ethers";
import network from "@ledgerhq/live-network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import type { Cursor, Page } from "@ledgerhq/coin-module-framework/api/index";
import type { AssetInfo, Stake } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { isExternalNodeConfig } from "../../network/node/types";
import type { StakingContractConfig } from "../../types/staking";
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

// Display-only validator name overlay. The precompile exposes no names, so we enrich
// the trustless on-chain set with the governed `monad-developers/validator-info` repo
// (see contracts.ts `validatorNameSource`), keyed by compressed secp pubkey hex.
// Names change rarely, so this cache lives far longer than the 30s on-chain page cache
// in ./index.ts, and is intentionally SEPARATE from it so name lookups stay warm even
// when a validator page is refetched.
const NAME_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h

type ValidatorInfo = { name: string };

/**
 * Resolve a validator's published name, or `null` when it has no published entry.
 * The resolved promise is cached, so a miss is not re-requested; only transient/non-404
 * errors are rethrown so the cache evicts and a later call retries.
 */
const fetchValidatorName = async (currencyId: string, secp: string): Promise<string | null> => {
  const baseUrl = STAKING_CONTRACTS[currencyId]?.validatorNameSource?.baseUrl;
  if (!baseUrl) return null;

  try {
    const res = await network<ValidatorInfo>({ url: `${baseUrl}${secp}.json`, method: "GET" });
    const name =
      typeof res?.data?.name === "string" && res.data.name.trim().length > 0 ? res.data.name : null;
    return name;
  } catch (error) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    // A 404 just means this validator hasn't published info — cache the miss.
    if (status === 404) return null;
    // Anything else is transient: log and rethrow so the cache doesn't pin a miss.
    log("coin-evm/staking", "fetchValidatorName: validator-info lookup failed", {
      currencyId,
      secp,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

// Concurrent calls for the same (currencyId, secp) share one in-flight request.
const validatorNameCache = makeLRUCache(
  fetchValidatorName,
  (currencyId: string, secp: string) => `${currencyId}-${secp}`,
  { max: 1000, ttl: NAME_CACHE_MAX_AGE_MS },
);

type ValidatorSetRaw = [boolean, bigint, bigint[]];
// getValidator returns 12 fields; we only type/validate the ones we read:
// [0] authAddress, [2] stake, [4] commission, [10] secpPubkey (bytes -> hex string).
type ValidatorRaw = [
  string,
  unknown,
  bigint,
  unknown,
  bigint,
  unknown,
  unknown,
  unknown,
  unknown,
  unknown,
  string,
];

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
    typeof value[4] === "bigint" &&
    typeof value[10] === "string"
  );
}

type DelegatorRaw = [bigint, bigint, bigint, bigint, bigint, bigint, bigint];
type DelegationsRaw = [boolean, bigint, bigint[]];

function isDelegatorRaw(value: unknown): value is DelegatorRaw {
  return (
    Array.isArray(value) &&
    typeof value[0] === "bigint" &&
    typeof value[3] === "bigint" &&
    typeof value[4] === "bigint"
  );
}

function isDelegationsRaw(value: unknown): value is DelegationsRaw {
  return (
    Array.isArray(value) &&
    typeof value[0] === "boolean" &&
    typeof value[1] === "bigint" &&
    Array.isArray(value[2]) &&
    value[2].every(item => typeof item === "bigint")
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

const callGetValidator = async (
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  contractAddress: string,
  valId: bigint,
): Promise<ValidatorRaw | null> => {
  const data = iface.encodeFunctionData("getValidator", [valId]);
  const raw = await provider.call({ to: contractAddress, data });
  const decoded = iface.decodeFunctionResult("getValidator", raw);
  return isValidatorRaw(decoded) ? decoded : null;
};

const fetchValidatorDetails = async (
  currencyId: string,
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
        const decoded = await callGetValidator(provider, iface, contractAddress, valId);
        if (!decoded) return undefined;

        const [, , stake, , commission, , , , , , secpPubkey] = decoded;
        const secp = secpPubkey.toLowerCase().replace(/^0x/, "");
        const name =
          secp.length > 0 ? await validatorNameCache(currencyId, secp).catch(() => null) : null;

        return {
          validatorAddress: ethers.computeAddress(secpPubkey),
          validatorId: valId.toString(),
          name: name ?? `Validator ${valId.toString()}`,
          commission: Number.parseFloat(ethers.formatUnits(commission, COMMISSION_DECIMALS)),
          // StakingValidatorItem.tokens is a string (see LIVE-31520); the bigint
          // stake serializes losslessly via toString().
          tokens: stake.toString(),
          estimatedYearlyRewardsRate: 0,
        };
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

      if (!res.value) return;

      items.push({ ...res.value, votingPower: items.length });
    });
  }

  return items;
};

export const getValidatorAddressById = async (
  currencyId: string,
  valId: bigint,
): Promise<string | null> => {
  const ctx = resolveContext(currencyId);
  if (!ctx) return null;

  try {
    return await withApi(
      ctx.currency,
      async provider => {
        const iface = new ethers.Interface(ctx.abi);
        const decoded = await callGetValidator(provider, iface, ctx.contractAddress, valId);
        if (!decoded) return null;
        const [, , , , , , , , , , secpPubkey] = decoded;
        return ethers.computeAddress(secpPubkey);
      },
      ctx.node,
    );
  } catch (error) {
    log("coin-evm/staking", "getValidatorAddressById: getValidator call failed", {
      currencyId,
      valId: valId.toString(),
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

const fetchPage = async (
  currencyId: string,
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
      : await fetchValidatorDetails(currencyId, provider, iface, contractAddress, pageIds);

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
        return fetchPage(currencyId, provider, iface, ctx.contractAddress, startIndex);
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

const MAX_DELEGATION_PAGES = 100;

const fetchDelegatedValIds = async (
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  contractAddress: string,
  delegator: string,
): Promise<bigint[]> => {
  const valIds: bigint[] = [];
  let startValId = 0n;

  for (let page = 0; page < MAX_DELEGATION_PAGES; page++) {
    const data = iface.encodeFunctionData("getDelegations", [delegator, startValId]);
    const raw = await provider.call({ to: contractAddress, data });
    const decoded = iface.decodeFunctionResult("getDelegations", raw);
    if (!isDelegationsRaw(decoded)) break;

    const [isDone, nextValId, pageIds] = decoded;
    valIds.push(...pageIds);

    if (isDone || pageIds.length === 0 || nextValId <= startValId) break;
    startValId = nextValId;
  }

  return valIds;
};

const fetchStakeForValId = async (
  currency: CryptoCurrency,
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  contractAddress: string,
  delegator: string,
  valId: bigint,
): Promise<Stake[]> => {
  const data = iface.encodeFunctionData("getDelegator", [valId, delegator]);
  const raw = await provider.call({ to: contractAddress, data });
  const decoded = iface.decodeFunctionResult("getDelegator", raw);
  if (!isDelegatorRaw(decoded)) return [];

  const [activeStake, , , deltaStake, nextDeltaStake] = decoded;
  const deltaStakes = deltaStake + nextDeltaStake;
  if (activeStake === 0n && deltaStakes === 0n) return [];

  const validator = await callGetValidator(provider, iface, contractAddress, valId).catch(
    () => null,
  );
  let validatorAddress: string | undefined;
  if (validator) {
    const [, , , , , , , , , , secpPubkey] = validator;
    validatorAddress = ethers.computeAddress(secpPubkey);
  }

  const asset: AssetInfo = {
    type: "native",
    name: currency.name,
    unit: currency.units[0],
  };
  const details = {
    contractAddress,
    ...(validatorAddress ? { validator: validatorAddress } : {}),
    validatorId: valId.toString(),
  };
  const makeStake = (state: Stake["state"], amount: bigint): Stake => ({
    uid: `${contractAddress}-${valId.toString()}-${delegator}-${state}`,
    address: delegator,
    ...(validatorAddress ? { delegate: validatorAddress } : {}),
    state,
    asset,
    amount,
    actions: [],
    details,
  });

  const stakes: Stake[] = [];
  if (activeStake !== 0n) stakes.push(makeStake("active", activeStake));
  if (deltaStakes !== 0n) stakes.push(makeStake("activating", deltaStakes));
  return stakes;
};

export const fetchMonadStakes = async (
  address: string,
  _config: StakingContractConfig,
  currency: CryptoCurrency,
): Promise<Stake[]> => {
  const ctx = resolveContext(currency.id);
  if (!ctx) return [];

  try {
    return await withApi(
      ctx.currency,
      async provider => {
        const iface = new ethers.Interface(ctx.abi);
        const valIds = await fetchDelegatedValIds(provider, iface, ctx.contractAddress, address);
        if (valIds.length === 0) return [];

        const stakes: Stake[] = [];
        for (let i = 0; i < valIds.length; i += DETAILS_BATCH_SIZE) {
          const chunk = valIds.slice(i, i + DETAILS_BATCH_SIZE);
          const settled = await Promise.allSettled(
            chunk.map(valId =>
              fetchStakeForValId(
                ctx.currency,
                provider,
                iface,
                ctx.contractAddress,
                address,
                valId,
              ),
            ),
          );

          settled.forEach((res, idx) => {
            if (res.status === "rejected") {
              log("coin-evm/staking", "fetchMonadStakes: getDelegator call failed", {
                valId: chunk[idx].toString(),
                error: res.reason instanceof Error ? res.reason.message : String(res.reason),
              });
              return;
            }
            if (res.value.length > 0) stakes.push(...res.value);
          });
        }

        return stakes;
      },
      ctx.node,
    );
  } catch (error) {
    log("coin-evm/staking", "fetchMonadStakes: delegations fetch failed", {
      currencyId: currency.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

export default {
  fetchValidators,
} satisfies ValidatorApi;
