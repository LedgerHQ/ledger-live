import { accountsABI, electionABI, lockedGoldABI } from "@celo/abis";
import { encodeFunctionData } from "viem";
import { getRegistryAddressFor } from "../network/registry";
import { getPendingWithdrawals } from "../network/sdk";
import type { CeloTxParams } from "./buildCeloTxParams";
import type { CeloStakingIntent } from "./stakingIntent";
import { getVoteNeighbors } from "./voteNeighbors";

/** Resolve the target validator group, preferring `valAddress` over `recipient`. */
const requireGroup = (intent: CeloStakingIntent): `0x${string}` => {
  const group = intent.valAddress ?? intent.recipient;
  if (!group) {
    throw new Error(`celo: ${intent.type} requires a validator group (valAddress)`);
  }
  return group as `0x${string}`;
};

/**
 * Pick the LockedGold pending-withdrawal index to withdraw: the earliest entry
 * whose unbonding period has elapsed. `getPendingWithdrawals` returns entries
 * sorted by maturity time (ascending), so the first matured one is the oldest.
 */
const resolveWithdrawIndex = async (address: string): Promise<bigint> => {
  const pending = await getPendingWithdrawals(address);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const matured = pending.find(w => w.time.lte(nowSeconds));
  if (!matured) {
    throw new Error("celo: no matured pending withdrawal is available to withdraw");
  }
  return BigInt(matured.index);
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
 * it is orthogonal to the staking operation (gas can be paid in an ERC-20).
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
      const index = await resolveWithdrawIndex(intent.sender);
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
      const { lesser, greater } = await getVoteNeighbors(to, group, intent.amount, true);
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

    case "celo.revokePending": {
      const to = await getRegistryAddressFor("Election");
      const group = requireGroup(intent);
      const { lesser, greater } = await getVoteNeighbors(to, group, intent.amount, false);
      return {
        to,
        data: encodeFunctionData({
          abi: electionABI,
          functionName: "revokePending",
          args: [group, intent.amount, lesser, greater, 0n],
        }),
        value: 0n,
        ...feeCurrencyField,
      };
    }

    case "celo.revokeActive": {
      const to = await getRegistryAddressFor("Election");
      const group = requireGroup(intent);
      const { lesser, greater } = await getVoteNeighbors(to, group, intent.amount, false);
      return {
        to,
        data: encodeFunctionData({
          abi: electionABI,
          functionName: "revokeActive",
          args: [group, intent.amount, lesser, greater, 0n],
        }),
        value: 0n,
        ...feeCurrencyField,
      };
    }

    default:
      throw new Error(`celo: unsupported staking operation "${(intent as { type: string }).type}"`);
  }
};
