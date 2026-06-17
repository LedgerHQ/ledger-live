import { ethers, type JsonRpcProvider } from "ethers";
import network from "@ledgerhq/live-network";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import type { Page } from "@ledgerhq/coin-module-framework/api/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { log } from "@ledgerhq/logs";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { StakingValidatorItem } from "@ledgerhq/types-live";
import { getCoinConfig } from "../../config";
import { withApi } from "../../network/node/rpc.common";
import { isExternalNodeConfig } from "../../network/node/types";
import { STAKING_CONTRACTS } from "../contracts";
import type { ValidatorApi } from "./types";

// Somnia's validator set is published by two contracts:
//
//   NodeCommittee (proxy 0x7b8b…331c7 → impl 0x4813…022c)
//     `getCurrentEpochCommittee()` returns the active 47-node committee for the
//     current epoch as a `tuple[]` of (uint, address operator, uint256 stake,
//     bytes pubkey1, bytes pubkey2, bytes pubkey3, bytes signature, bytes ???).
//     We only consume `operator` and `stake`; pubkeys are opaque to the wallet.
//
//   Staking (proxy 0xBe36…8250 → impl 0x871e…6F71)
//     `getValidatorDelegatedStakeRate(address validator)` returns the
//     validator's delegator share in basis points (10000 = 100%).
//     Commission = 1 - rate. Selector 0x9aeb956d verified against the
//     deployed bytecode.
//
// Neither contract is verified on Blockscout, so the ABI fragments below were
// recovered from the staking dashboard's bundled JS + 4byte directory.
//
// Display names live off-chain at /api/validator-names on the official
// dashboard — it's a flat { [address]: name } JSON map maintained by Somnia.
// Treat it as a display overlay; the on-chain set remains authoritative.

const NODE_COMMITTEE_ABI = [
  // tuple shape: [uint, address operator, uint256 stake, bytes, bytes, bytes, bytes, bytes]
  // Only the first three slots are typed precisely — the rest are accepted as
  // opaque `bytes` so a future contract upgrade that touches the pubkey blob
  // doesn't break decoding of the fields we care about.
  "function getCurrentEpochCommittee() view returns (tuple(uint256 flag, address operator, uint256 stake, bytes p1, bytes p2, bytes p3, bytes p4, bytes p5)[])",
] as const;

const STAKING_READ_ABI = [
  // 0x9aeb956d — getValidatorDelegatedStakeRate(address) → uint256 in basis
  // points (10000 = 100%). Selector + signature verified by reproducing the
  // keccak256 of the function name against the deployed runtime bytecode.
  "function getValidatorDelegatedStakeRate(address validator) view returns (uint256)",
] as const;

// Basis points denominator. getValidatorDelegatedStakeRate returns e.g. 8000 → 80% to delegators.
const BPS_DENOMINATOR = 10_000;

// Per-validator getValidatorDelegatedStakeRate is one eth_call each; cap concurrency to avoid
// node-side rate limiting (same rationale as monad.ts:DETAILS_BATCH_SIZE).
const DETAILS_BATCH_SIZE = 10;

// Names map changes rarely (Somnia operators rebrand maybe quarterly), so it
// outlives the 30s on-chain page cache in ./index.ts. Lookups stay warm even
// when the validator set is refetched.
const NAME_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6h

type ValidatorNamesMap = Record<string, string>;

/**
 * Fetch the operator→display-name map published by the official staking
 * dashboard. Returns an empty map on failure so a transient network blip
 * degrades names to "Validator 0x…" rather than failing the whole page.
 */
const fetchValidatorNames = async (currencyId: string): Promise<ValidatorNamesMap> => {
  const baseUrl = STAKING_CONTRACTS[currencyId]?.validatorNameSource?.baseUrl;
  if (!baseUrl) return {};

  try {
    const res = await network<ValidatorNamesMap>({ url: baseUrl, method: "GET" });
    const data = res?.data;
    if (!data || typeof data !== "object") return {};
    // Normalise keys to lowercase — operator addresses on Somnia are checksummed
    // mixed-case from eth_call but the dashboard publishes them lowercase.
    const out: ValidatorNamesMap = {};
    for (const [addr, name] of Object.entries(data)) {
      if (typeof name === "string" && name.trim().length > 0) {
        out[addr.toLowerCase()] = name;
      }
    }
    return out;
  } catch (error) {
    log("coin-evm/staking", "fetchValidatorNames: validator-names lookup failed", {
      currencyId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {};
  }
};

const validatorNamesCache = makeLRUCache(
  fetchValidatorNames,
  (currencyId: string) => currencyId,
  { max: 10, ttl: NAME_CACHE_MAX_AGE_MS },
);

type CommitteeMember = {
  operator: string;
  stake: bigint;
};

/**
 * Decode the `tuple[]` returned by getCurrentEpochCommittee(). We only surface
 * the fields the wallet UI consumes (operator address + stake); the BLS
 * pubkeys are kept opaque so a contract upgrade that resizes them does not
 * break this decoder.
 */
const decodeCommittee = (iface: ethers.Interface, raw: string): CommitteeMember[] => {
  const decoded = iface.decodeFunctionResult("getCurrentEpochCommittee", raw);
  const tuples = decoded[0];
  if (!Array.isArray(tuples)) return [];

  return tuples
    .map((entry: unknown): CommitteeMember | null => {
      if (!Array.isArray(entry)) return null;
      const operator = entry[1];
      const stake = entry[2];
      if (typeof operator !== "string" || typeof stake !== "bigint") return null;
      return { operator, stake };
    })
    .filter((m): m is CommitteeMember => m !== null);
};

/**
 * getValidatorDelegatedStakeRate(validator) → bps. Returns null on revert/decoding failure so
 * the caller can fall back to an unknown commission rather than dropping the
 * validator from the list.
 */
const fetchDelegationRateBps = async (
  provider: JsonRpcProvider,
  iface: ethers.Interface,
  stakingAddress: string,
  validator: string,
): Promise<number | null> => {
  try {
    const data = iface.encodeFunctionData("getValidatorDelegatedStakeRate", [validator]);
    const raw = await provider.call({ to: stakingAddress, data });
    const decoded = iface.decodeFunctionResult("getValidatorDelegatedStakeRate", raw);
    const bps = decoded[0];
    return typeof bps === "bigint" ? Number(bps) : null;
  } catch (error) {
    log("coin-evm/staking", "fetchDelegationRateBps: getValidatorDelegatedStakeRate call failed", {
      validator,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};

type ResolvedContext = {
  currency: CryptoCurrency;
  node: { type: "external"; uri: string; retries?: number };
  nodeCommitteeAddress: string;
  stakingAddress: string;
};

const resolveContext = (currencyId: string): ResolvedContext | undefined => {
  const config = STAKING_CONTRACTS[currencyId];
  if (!config) return undefined;

  const node = getCoinConfig(currencyId).info.node;
  if (!isExternalNodeConfig(node)) return undefined;

  // Somnia's staking config exposes two addresses: the user-facing staking
  // contract (delegate / undelegate / claim) and the NodeCommittee that owns
  // the validator set. The first is `contractAddress`; the second is encoded
  // in `specificContractAddressByOperation` under a chain-specific operation
  // namespace (see contracts.ts).
  const stakingAddress = config.contractAddress;
  const nodeCommitteeAddress =
    config.specificContractAddressByOperation?.getStakedBalance ?? stakingAddress;

  try {
    const currency = getCryptoCurrencyById(currencyId);
    return { currency, node, stakingAddress, nodeCommitteeAddress };
  } catch {
    return undefined;
  }
};

/**
 * Hydrate raw committee members with the per-validator commission and the
 * display name from the off-chain registry. Concurrency is capped so the RPC
 * provider isn't hammered with 47 simultaneous `getValidatorDelegatedStakeRate` calls.
 */
const fetchValidatorDetails = async (
  currencyId: string,
  provider: JsonRpcProvider,
  stakingIface: ethers.Interface,
  stakingAddress: string,
  members: CommitteeMember[],
): Promise<StakingValidatorItem[]> => {
  const names = await validatorNamesCache(currencyId).catch(() => ({}) as ValidatorNamesMap);

  const items: StakingValidatorItem[] = [];

  for (let i = 0; i < members.length; i += DETAILS_BATCH_SIZE) {
    const chunk = members.slice(i, i + DETAILS_BATCH_SIZE);
    const settled = await Promise.allSettled(
      chunk.map(async member => {
        const bps = await fetchDelegationRateBps(
          provider,
          stakingIface,
          stakingAddress,
          member.operator,
        );
        // Somnia returns the DELEGATOR share in bps; commission is the
        // complement. `null` rate (call reverted) is surfaced as 0 commission
        // so the validator still shows up — UI can flag "unknown" later.
        const commission = bps === null ? 0 : 1 - bps / BPS_DENOMINATOR;
        const operatorLower = member.operator.toLowerCase();
        const name = names[operatorLower] ?? `Validator ${shortenAddress(member.operator)}`;

        return {
          validatorAddress: member.operator,
          name,
          commission,
          tokens: member.stake.toString(),
          estimatedYearlyRewardsRate: 0,
        };
      }),
    );

    settled.forEach((res, idx) => {
      if (res.status === "rejected") {
        log("coin-evm/staking", "fetchValidatorDetails: detail enrichment failed", {
          validator: chunk[idx].operator,
          error: res.reason instanceof Error ? res.reason.message : String(res.reason),
        });
        return;
      }
      items.push({ ...res.value, votingPower: items.length });
    });
  }

  return items;
};

const shortenAddress = (addr: string): string =>
  `${addr.slice(0, 6)}…${addr.slice(-4)}`;

/**
 * Fetch the entire active committee. Somnia returns the whole set in one
 * eth_call — there is no pagination, so the returned `next` is always
 * undefined (mirrors sei.ts).
 */
const fetchValidators = async (currencyId: string): Promise<Page<StakingValidatorItem>> => {
  const ctx = resolveContext(currencyId);
  if (!ctx) return { items: [], next: undefined };

  try {
    return await withApi(
      ctx.currency,
      async provider => {
        const committeeIface = new ethers.Interface(NODE_COMMITTEE_ABI);
        const stakingIface = new ethers.Interface(STAKING_READ_ABI);

        const data = committeeIface.encodeFunctionData("getCurrentEpochCommittee", []);
        const raw = await provider.call({ to: ctx.nodeCommitteeAddress, data });
        const members = decodeCommittee(committeeIface, raw);
        if (members.length === 0) return { items: [], next: undefined };

        const items = await fetchValidatorDetails(
          currencyId,
          provider,
          stakingIface,
          ctx.stakingAddress,
          members,
        );

        return { items, next: undefined };
      },
      ctx.node,
    );
  } catch (error) {
    log("coin-evm/staking", "fetchValidators: Somnia validator fetch failed", {
      error: error instanceof Error ? error.message : String(error),
      currencyId,
    });
    return { items: [], next: undefined };
  }
};

export default {
  fetchValidators,
} satisfies ValidatorApi;
