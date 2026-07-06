import { accountsABI, electionABI, lockedGoldABI } from "@celo/abis";
import { encodeFunctionData } from "viem";
import { getCeloClient } from "../network/client";
import { getRegistryAddressFor } from "../network/registry";
import { getPendingWithdrawals, voteSignerAccount } from "../network/sdk";
import { getVoteNeighbors } from "../network/voteNeighbors";
import type { CeloTxParams } from "./buildCeloTxParams";
import type { CeloStakingIntent } from "./stakingIntent";

/** Resolve the target validator group from `valAddress`, or `recipient` (the channel the framework populates). */
const requireGroup = (intent: CeloStakingIntent): `0x${string}` => {
  const group = intent.valAddress ?? intent.recipient;
  if (!group) {
    throw new Error(`celo: ${intent.type} requires a validator group (valAddress)`);
  }
  return group as `0x${string}`;
};

/**
 * Pick the LockedGold pending-withdrawal index to withdraw. When `intent.index`
 * is set, that specific (matured) withdrawal is used; otherwise the earliest
 * matured entry. `getPendingWithdrawals` assigns each entry its on-chain array
 * index before sorting by maturity, so the returned index is the contract index.
 */
const resolveWithdrawIndex = async (intent: CeloStakingIntent): Promise<bigint> => {
  const pending = await getPendingWithdrawals(intent.sender);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (typeof intent.index === "number") {
    const chosen = pending.find(w => w.index === intent.index);
    if (!chosen || !chosen.time.lte(nowSeconds)) {
      throw new Error(`celo: pending withdrawal ${intent.index} is unavailable or not yet matured`);
    }
    return BigInt(chosen.index);
  }

  const matured = pending.find(w => w.time.lte(nowSeconds));
  if (!matured) {
    throw new Error("celo: no matured pending withdrawal is available to withdraw");
  }
  return BigInt(matured.index);
};

/**
 * The Election `revoke*` calls take the group's index in the account's list of
 * voted-for groups (the contract asserts `groups[index] == group`). Resolve it
 * from `getGroupsVotedForByAccount` rather than assuming position 0.
 */
const resolveVotedGroupIndex = async (
  sender: string,
  electionAddress: `0x${string}`,
  group: `0x${string}`,
): Promise<bigint> => {
  const signer = (await voteSignerAccount(sender)) as `0x${string}`;
  const groups = await getCeloClient().readContract({
    address: electionAddress,
    abi: electionABI,
    functionName: "getGroupsVotedForByAccount",
    args: [signer],
  });
  const index = groups.findIndex(g => g.toLowerCase() === group.toLowerCase());
  if (index < 0) {
    throw new Error(`celo: ${group} is not in the account's voted groups`);
  }
  return BigInt(index);
};

/**
 * Build the Election `revoke*` tx params. `revokePending` and `revokeActive` are
 * otherwise identical — same neighbors lookup, voted-group index and args — so
 * they differ only by the contract function called.
 */
const buildRevokeTxParams = async (
  intent: CeloStakingIntent,
  functionName: "revokePending" | "revokeActive",
  feeCurrencyField: { feeCurrency?: `0x${string}` },
): Promise<CeloTxParams> => {
  const to = await getRegistryAddressFor("Election");
  const group = requireGroup(intent);
  const [{ lesser, greater }, index] = await Promise.all([
    getVoteNeighbors(to, group, intent.amount, false),
    resolveVotedGroupIndex(intent.sender, to, group),
  ]);
  return {
    to,
    data: encodeFunctionData({
      abi: electionABI,
      functionName,
      args: [group, intent.amount, lesser, greater, index],
    }),
    value: 0n,
    ...feeCurrencyField,
  };
};

/**
 * Derives the on-chain target, calldata and value for a Celo staking intent,
 * encoding the same contract calls as the legacy bridge
 * (`src/bridge/buildTransaction.ts`) with `@celo/abis` + viem. The result feeds
 * the shared `craftTransaction` pipeline, so staking transactions inherit
 * CIP-64 fee-currency support, `viem/celo` serialization, `combine` and
 * `broadcast` unchanged.
 *
 * `feeCurrency` (a CIP-64 adapter address) is attached unchanged when provided;
 * it is orthogonal to the staking operation.
 */
export const buildStakingTxParams = async (
  intent: CeloStakingIntent,
  feeCurrency?: `0x${string}`,
): Promise<CeloTxParams> => {
  const feeCurrencyField = feeCurrency ? { feeCurrency } : {};

  switch (intent.type) {
    case "celo.register": {
      const to = await getRegistryAddressFor("Accounts");
      return {
        to,
        data: encodeFunctionData({ abi: accountsABI, functionName: "createAccount" }),
        value: 0n,
        ...feeCurrencyField,
      };
    }

    case "celo.lock": {
      const to = await getRegistryAddressFor("LockedGold");
      return {
        to,
        data: encodeFunctionData({ abi: lockedGoldABI, functionName: "lock" }),
        value: intent.amount,
        ...feeCurrencyField,
      };
    }

    case "celo.unlock": {
      const to = await getRegistryAddressFor("LockedGold");
      return {
        to,
        data: encodeFunctionData({
          abi: lockedGoldABI,
          functionName: "unlock",
          args: [intent.amount],
        }),
        value: 0n,
        ...feeCurrencyField,
      };
    }

    case "celo.withdraw": {
      const to = await getRegistryAddressFor("LockedGold");
      const index = await resolveWithdrawIndex(intent);
      return {
        to,
        data: encodeFunctionData({
          abi: lockedGoldABI,
          functionName: "withdraw",
          args: [index],
        }),
        value: 0n,
        ...feeCurrencyField,
      };
    }

    case "celo.vote": {
      const to = await getRegistryAddressFor("Election");
      const group = requireGroup(intent);
      // Reject a vote that would exceed the group's cap *before* crafting, so the
      // failure surfaces here rather than as a masked `eth_estimateGas` revert.
      const [canVote, { lesser, greater }] = await Promise.all([
        getCeloClient().readContract({
          address: to,
          abi: electionABI,
          functionName: "canReceiveVotes",
          args: [group, intent.amount],
        }),
        getVoteNeighbors(to, group, intent.amount, true),
      ]);
      if (!canVote) {
        throw new Error(
          `celo: validator group ${group} cannot receive that many more votes (cap exceeded)`,
        );
      }
      return {
        to,
        data: encodeFunctionData({
          abi: electionABI,
          functionName: "vote",
          args: [group, intent.amount, lesser, greater],
        }),
        value: 0n,
        ...feeCurrencyField,
      };
    }

    case "celo.activate": {
      const to = await getRegistryAddressFor("Election");
      const group = requireGroup(intent);
      return {
        to,
        data: encodeFunctionData({
          abi: electionABI,
          functionName: "activate",
          args: [group],
        }),
        value: 0n,
        ...feeCurrencyField,
      };
    }

    case "celo.revokePending":
      return buildRevokeTxParams(intent, "revokePending", feeCurrencyField);

    case "celo.revokeActive":
      return buildRevokeTxParams(intent, "revokeActive", feeCurrencyField);

    default:
      throw new Error(`celo: unsupported staking operation "${(intent as { type: string }).type}"`);
  }
};
