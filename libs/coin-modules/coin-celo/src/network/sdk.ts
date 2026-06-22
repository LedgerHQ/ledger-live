import { accountsABI, electionABI, lockedGoldABI } from "@celo/abis";
import { makeLRUCache } from "@ledgerhq/live-network/cache";
import { BigNumber } from "bignumber.js";
import { celoGasPrice, getCeloClient } from "./client";
import { getRegistryAddressFor } from "./registry";
import type { CeloVote } from "../types/types";

/**
 * CIP-64 transaction type byte. See https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0064.md
 */
const CIP64_TX_TYPE = "0x7b";

type CeloRpcTransaction = {
  type?: string;
  feeCurrency?: `0x${string}` | null;
};

// CIP-64 `feeCurrency` is always a 20-byte EVM address. Reject anything else
// (e.g. "0x1", "0xZZZ") rather than persisting garbage that would silently
// mis-render ops and never retry — sync only retries when feeCurrencyAddress
// is absent, not when it points to a non-existent contract.
const ADDRESS_RE = /^0x[0-9a-f]{40}$/i;

const isCeloRpcTransaction = (v: unknown): v is CeloRpcTransaction => {
  if (v === null || typeof v !== "object") return false;
  const obj = v as Record<string, unknown>;
  if (obj.type !== undefined && typeof obj.type !== "string") return false;
  if (obj.feeCurrency !== undefined && obj.feeCurrency !== null) {
    if (typeof obj.feeCurrency !== "string" || !ADDRESS_RE.test(obj.feeCurrency)) return false;
  }
  return true;
};

// 32-byte tx hash: "0x" + 64 hex chars.
const TX_HASH_RE = /^0x[0-9a-f]{64}$/i;
const isHexHash = (s: string): s is `0x${string}` => TX_HASH_RE.test(s);

/**
 * Returns the lowercased fee-currency address for a CIP-64 tx, `null` for a
 * confirmed non-CIP-64 (native CELO) tx, or throws on RPC failure / tx-not-found.
 *
 * Callers MUST distinguish `null` from a thrown error: persisting "native" for
 * a transient RPC failure would permanently mis-label a real CIP-64 op.
 */
export const getCeloTransactionFeeCurrency = async (hash: string): Promise<string | null> => {
  if (!isHexHash(hash)) throw new Error(`Invalid Celo tx hash: ${hash}`);
  const client = getCeloClient();
  const result: unknown = await client.request({
    method: "eth_getTransactionByHash",
    params: [hash],
  });
  if (!isCeloRpcTransaction(result)) throw new Error(`Celo tx ${hash} not found`);
  // JSON-RPC nodes may return hex strings in mixed case (e.g. "0x7B").
  if (result.type?.toLowerCase() !== CIP64_TX_TYPE) return null;
  // CIP-64 with no feeCurrency = malformed response. Throwing forces a retry on
  // the next sync — returning null here would persist the NATIVE sentinel and
  // permanently mis-label a real CIP-64 op.
  if (!result.feeCurrency) throw new Error(`Celo tx ${hash} is CIP-64 but feeCurrency is missing`);
  return result.feeCurrency.toLowerCase();
};

/**
 * Fetch account registered status. To lock any Celo, account needs to be registered first.
 */
export const getAccountRegistrationStatus = async (address: string): Promise<boolean> => {
  const client = getCeloClient();
  const accountsAddress = await getRegistryAddressFor("Accounts");
  return client.readContract({
    address: accountsAddress,
    abi: accountsABI,
    functionName: "isAccount",
    args: [address as `0x${string}`],
  });
};

/**
 * Fetch pending withdrawals, with an index.
 */
export const getPendingWithdrawals = async (address: string) => {
  const client = getCeloClient();
  const lockedGoldAddress = await getRegistryAddressFor("LockedGold");
  const [values, timestamps] = await client.readContract({
    address: lockedGoldAddress,
    abi: lockedGoldABI,
    functionName: "getPendingWithdrawals",
    args: [address as `0x${string}`],
  });

  return [...values]
    .map((value, index) => ({
      value: new BigNumber(value.toString()),
      time: new BigNumber(timestamps[index].toString()),
      index,
    }))
    .sort((a, b) => a.time.minus(b.time).toNumber());
};

/**
 * Fetch all votes.
 *
 * The Celo Election contract does not expose a single aggregated `getVoter`
 * call (that helper only exists in the JS contractkit). We therefore mirror
 * its behaviour by listing the groups voted for and then querying pending /
 * active stakes group-by-group.
 */
export const getVotes = async (address: string): Promise<CeloVote[]> => {
  const client = getCeloClient();
  const electionAddress = await getRegistryAddressFor("Election");
  const signerAddress = (await voteSignerAccount(address)) as `0x${string}`;

  let groups: readonly `0x${string}`[];
  try {
    groups = await client.readContract({
      address: electionAddress,
      abi: electionABI,
      functionName: "getGroupsVotedForByAccount",
      args: [signerAddress],
    });
  } catch {
    return [];
  }

  const groupedVotes = await Promise.all(
    groups.map(async group => {
      const [pendingRaw, activeRaw] = await Promise.all([
        client.readContract({
          address: electionAddress,
          abi: electionABI,
          functionName: "getPendingVotesForGroupByAccount",
          args: [group, signerAddress],
        }),
        client.readContract({
          address: electionAddress,
          abi: electionABI,
          functionName: "getActiveVotesForGroupByAccount",
          args: [group, signerAddress],
        }),
      ]);

      const pending = new BigNumber(pendingRaw.toString());
      const active = new BigNumber(activeRaw.toString());
      const groupVotes: CeloVote[] = [];

      const activatable = pending.gt(0)
        ? await client.readContract({
            address: electionAddress,
            abi: electionABI,
            functionName: "hasActivatablePendingVotes",
            args: [signerAddress, group],
          })
        : false;

      let activeVoteRevokable = true;

      if (pending.gt(0)) {
        activeVoteRevokable = false;
        groupVotes.push({
          validatorGroup: group,
          amount: pending,
          activatable,
          revokable: true,
          index: 0,
          type: "pending",
        });
      }

      if (active.gt(0)) {
        groupVotes.push({
          validatorGroup: group,
          amount: active,
          activatable: false,
          revokable: activeVoteRevokable,
          index: 1,
          type: "active",
        });
      }

      return groupVotes;
    }),
  );

  return groupedVotes.flat();
};

/**
 * Fetch and cache the vote signer account for an address.
 * Cache is held for 1 hour since vote signer is usually the same account.
 */
export const voteSignerAccount = makeLRUCache(
  async (address: string): Promise<string> => {
    const client = getCeloClient();
    const accountsAddress = await getRegistryAddressFor("Accounts");
    return client.readContract({
      address: accountsAddress,
      abi: accountsABI,
      functionName: "voteSignerToAccount",
      args: [address as `0x${string}`],
    });
  },
  address => address,
  {
    ttl: 60 * 60 * 1000, // 1 hour
  },
);

/**
 * Compute fee market gas parameters (mirrors @celo/connect `setFeeMarketGas`).
 * Returns maxFeePerGas and maxPriorityFeePerGas as bigint.
 */
export const getFeeMarketGasParams = async (
  feeCurrency?: `0x${string}`,
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> => {
  const client = getCeloClient();
  const [gasPrice, maxPriorityFeePerGas] = await Promise.all([
    celoGasPrice(feeCurrency),
    client.estimateMaxPriorityFeePerGas(),
  ]);

  const baseFeePerGas =
    gasPrice > maxPriorityFeePerGas ? gasPrice - maxPriorityFeePerGas : BigInt(0);
  const maxFeePerGas = (baseFeePerGas * BigInt(120)) / BigInt(100) + maxPriorityFeePerGas;

  return { maxFeePerGas, maxPriorityFeePerGas };
};
