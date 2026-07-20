import { ethers, type JsonRpcProvider } from "ethers";
import network from "@ledgerhq/live-network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import type { Page } from "@ledgerhq/coin-module-framework/api/index";
import type { AssetInfo, Stake } from "@ledgerhq/coin-module-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { isExternalNodeConfig } from "../../network/node/types";
import type { StakingContractConfig } from "../../types/staking";
import { getStakingABI } from "../abis";
import { STAKING_CONTRACTS } from "../contracts";
import type { ValidatorApi } from "./types";

const DETAILS_BATCH_SIZE = 10;
const DELEGATE_STAKE_RATE_DECIMALS = 18;
const NAME_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h

// Map of lowercased validator operator address -> published name.
type ValidatorNamesMap = Record<string, string>;

// The names endpoint is a flat { [address]: name } map. Guard against anything else —
// notably a JSON-RPC error/handshake blob (e.g. { jsonrpc, id, error }) served by a
// misconfigured baseUrl — so we never ingest non-address keys as fake names.
function isValidatorNamesMap(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !("jsonrpc" in value) &&
    !("error" in value)
  );
}

// getStake ABI tuple (for reference): [validator, stakedAmount, accumulatedRewards, delegatedStake,
// delegateStakeRate, ...]. We only consume stakedAmount, delegatedStake and delegateStakeRate, so the
// type is narrowed to exactly what the predicate below verifies — index 0/2 stay `unknown` since they
// are never checked nor read, keeping the type and the runtime guard aligned (and sound).
type StakeStructRaw = [unknown, bigint, unknown, bigint, bigint];

function isStakeStructRaw(value: unknown): value is StakeStructRaw {
  return (
    Array.isArray(value) &&
    typeof value[1] === "bigint" &&
    typeof value[3] === "bigint" &&
    typeof value[4] === "bigint"
  );
}

// getDelegationInfo outputs: (amount uint256, pendingRewards uint256)
type DelegationInfoRaw = [bigint, bigint];

function isDelegationInfoRaw(value: unknown): value is DelegationInfoRaw {
  return Array.isArray(value) && typeof value[0] === "bigint" && typeof value[1] === "bigint";
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
      contractAddress: config.contractAddress(),
    };
  } catch {
    return undefined;
  }
};

/**
 * Resolve the published validator-name overlay as a lowercased `{ address: name }` map.
 * Returns `{}` when unconfigured/malformed; rethrows on transient network errors so the cache evicts.
 * Callers should treat it as best-effort and fall back to the on-chain address as the display name.
 */
export const fetchValidatorNames = async (currencyId: string): Promise<ValidatorNamesMap> => {
  const baseUrl = STAKING_CONTRACTS[currencyId]?.validatorNameSource?.baseUrl;
  if (!baseUrl) return {};

  try {
    const res = await network({ url: baseUrl, method: "GET" });
    const data = res?.data;
    if (!isValidatorNamesMap(data)) return {};
    const out: ValidatorNamesMap = {};
    for (const [addr, name] of Object.entries(data)) {
      // Only keep valid EVM address keys with a non-empty name, so an unexpected
      // payload can't pollute the map (and cache) with non-address keys.
      if (typeof name === "string" && name.trim().length > 0 && ethers.isAddress(addr)) {
        out[addr.toLowerCase()] = name.trim();
      }
    }
    return out;
  } catch (error) {
    log("coin-evm/staking", "fetchValidatorNames: validator-names lookup failed", {
      currencyId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

const validatorNamesCache = makeLRUCache(fetchValidatorNames, (currencyId: string) => currencyId, {
  max: 10,
  ttl: NAME_CACHE_MAX_AGE_MS,
});

// Drop the cached validator-names overlay for a currency (primarily to keep tests deterministic,
// since the cache is module-level and keyed only by currencyId).
export const clearValidatorNamesCache = (currencyId: string): void =>
  validatorNamesCache.clear(currencyId);

const fetchValidatorDetails = async (
  currencyId: string,
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  contractAddress: string,
  addresses: string[],
): Promise<StakingValidatorItem[]> => {
  const names = await validatorNamesCache(currencyId).catch(() => ({}) as ValidatorNamesMap);

  const items: StakingValidatorItem[] = [];

  for (let i = 0; i < addresses.length; i += DETAILS_BATCH_SIZE) {
    const chunk = addresses.slice(i, i + DETAILS_BATCH_SIZE);
    const settled = await Promise.allSettled(
      chunk.map(async address => {
        const data = iface.encodeFunctionData("getStake", [address]);
        const raw = await provider.call({ to: contractAddress, data });
        const decoded = iface.decodeFunctionResult("getStake", raw);
        if (!isStakeStructRaw(decoded[0])) return undefined;
        const [, stakedAmount, , delegatedStake, delegateStakeRate] = decoded[0];

        const validatorAddress = ethers.getAddress(address);
        const name = names[address.toLowerCase()] ?? null;
        const commission = Math.max(
          0,
          1 -
            Number.parseFloat(ethers.formatUnits(delegateStakeRate, DELEGATE_STAKE_RATE_DECIMALS)),
        );

        return {
          validatorAddress,
          name: name ?? validatorAddress,
          commission,
          tokens: (stakedAmount + delegatedStake).toString(),
          estimatedYearlyRewardsRate: 0,
        };
      }),
    );

    settled.forEach((res, idx) => {
      if (res.status === "rejected") {
        log("coin-evm/staking", "fetchSomniaValidatorDetails: getStake call failed", {
          address: chunk[idx],
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

const fetchValidators = async (currencyId: string): Promise<Page<StakingValidatorItem>> => {
  const ctx = resolveContext(currencyId);
  if (!ctx) return { items: [], next: undefined };

  try {
    return await withApi(
      ctx.currency,
      async provider => {
        const iface = new ethers.Interface(ctx.abi);
        const data = iface.encodeFunctionData("getCommitteeValidators", []);
        const raw = await provider.call({ to: ctx.contractAddress, data });
        const decoded = iface.decodeFunctionResult("getCommitteeValidators", raw);

        const addresses: string[] = Array.isArray(decoded[0])
          ? decoded[0].filter((v): v is string => typeof v === "string")
          : [];
        if (addresses.length === 0) return { items: [], next: undefined };

        const items = await fetchValidatorDetails(
          currencyId,
          provider,
          iface,
          ctx.contractAddress,
          addresses,
        );
        return { items, next: undefined };
      },
      ctx.node,
    );
  } catch (error) {
    log("coin-evm/staking", "fetchSomniaValidators: fetch failed", {
      currencyId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { items: [], next: undefined };
  }
};

type StakeData = {
  amount: bigint;
  rewards: bigint;
};

const fetchStakeForValidator = async (
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  contractAddress: string,
  staker: string,
  validatorAddress: string,
): Promise<StakeData> => {
  // getDelegationInfo is authoritative: a single call returns BOTH the staked amount and the
  // staker's pending rewards, so there's no need for a separate (and revert-prone)
  // getDelegatedStakerRewards lookup. A failure here propagates so the caller skips this
  // validator.
  const delegationInfoRaw = await provider.call({
    to: contractAddress,
    data: iface.encodeFunctionData("getDelegationInfo", [staker, validatorAddress]),
  });
  const delegationInfo = iface.decodeFunctionResult("getDelegationInfo", delegationInfoRaw);
  if (!isDelegationInfoRaw(delegationInfo)) {
    throw new Error("getDelegationInfo returned unexpected format");
  }

  return { amount: delegationInfo[0], rewards: delegationInfo[1] };
};

const toStake = (
  staker: string,
  validatorAddress: string,
  contractAddress: string,
  asset: AssetInfo,
  { amount, rewards }: StakeData,
  name: string | null,
): Stake | null => {
  if (amount === 0n && rewards === 0n) return null;

  const checksummed = ethers.getAddress(validatorAddress);
  // A delegation returned by getDelegations with a positive amount is active. The contract's
  // getTimeUntilUnstake is a global constant (the 21-day unstaking PERIOD, identical for every
  // validator/address), not a per-delegation remaining time — so it can't tell us whether this
  // delegation is unstaking. Using it here previously marked EVERY delegation "deactivating",
  // which hid it from the active delegations list.
  return {
    uid: `${contractAddress}-${checksummed}-${staker}`,
    address: staker,
    delegate: checksummed,
    state: "active",
    asset,
    amount,
    ...(rewards > 0n ? { amountRewarded: rewards } : {}),
    actions: [],
    // `validatorName` is the display-name overlay the UI shows instead of the raw address.
    details: { contractAddress, validator: checksummed, ...(name ? { validatorName: name } : {}) },
  };
};

export const fetchSomniaStakes = async (
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

        const delegationsRaw = await provider.call({
          to: ctx.contractAddress,
          data: iface.encodeFunctionData("getDelegations", [address]),
        });
        const delegationsDecoded = iface.decodeFunctionResult("getDelegations", delegationsRaw);
        const validatorAddresses: string[] = Array.isArray(delegationsDecoded[0])
          ? delegationsDecoded[0].filter((v): v is string => typeof v === "string")
          : [];

        if (validatorAddresses.length === 0) return [];

        // Display-name overlay, keyed by lowercased operator address. Best-effort: on failure
        // the delegation still shows, falling back to the raw address as its name.
        const names = await validatorNamesCache(currency.id).catch(() => ({}) as ValidatorNamesMap);

        const asset: AssetInfo = {
          type: "native",
          name: ctx.currency.name,
          unit: ctx.currency.units[0],
        };
        const stakes: Stake[] = [];

        for (let i = 0; i < validatorAddresses.length; i += DETAILS_BATCH_SIZE) {
          const chunk = validatorAddresses.slice(i, i + DETAILS_BATCH_SIZE);
          const settled = await Promise.allSettled(
            chunk.map(validatorAddress =>
              fetchStakeForValidator(
                provider,
                iface,
                ctx.contractAddress,
                address,
                validatorAddress,
              ),
            ),
          );

          settled.forEach((res, idx) => {
            const validatorAddress = chunk[idx];
            if (res.status === "rejected") {
              log("coin-evm/staking", "fetchSomniaStakes: stake fetch failed", {
                validator: validatorAddress,
                error: res.reason instanceof Error ? res.reason.message : String(res.reason),
              });
              return;
            }
            try {
              const stake = toStake(
                address,
                validatorAddress,
                ctx.contractAddress,
                asset,
                res.value,
                names[validatorAddress.toLowerCase()] ?? null,
              );
              if (stake) stakes.push(stake);
            } catch (error) {
              // A malformed validator address (or other toStake failure) shouldn't drop the
              // rest of the batch — skip this one and keep the valid stakes.
              log("coin-evm/staking", "fetchSomniaStakes: toStake failed", {
                validator: validatorAddress,
                error: error instanceof Error ? error.message : String(error),
              });
            }
          });
        }
        return stakes;
      },
      ctx.node,
    );
  } catch (error) {
    log("coin-evm/staking", "fetchSomniaStakes: delegations fetch failed", {
      currencyId: currency.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
};

const somniaValidatorApi: ValidatorApi = {
  fetchValidators,
};

export default somniaValidatorApi;
