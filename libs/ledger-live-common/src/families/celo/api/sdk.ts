import { ContractKit, newKit } from "@celo/contractkit";
import { getEnv } from "../../../env";
import { CeloVote } from "../types";
import { makeLRUCache } from "../../../cache";

let kit: ContractKit;
export const celoKit = () => {
  if (!kit) kit = newKit(getEnv("API_CELO_NODE"));
  return kit;
};

/**
 * Fetch account registered status. To lock any Celo, account needs to be registered first
 */
export const getAccountRegistrationStatus = async (
  address: string
): Promise<boolean> => {
  const accounts = await celoKit().contracts.getAccounts();
  return await accounts.isAccount(address);
};

/**
 * Fetch pending withdrawals, with an index
 */
export const getPendingWithdrawals = async (address: string) => {
  const lockedGold = await celoKit().contracts.getLockedGold();
  const pendingWithdrawals = await lockedGold.getPendingWithdrawals(address);
  const pendingWithdrawalsWithIndexes = pendingWithdrawals
    .map((withdrawal, index) => ({
      ...withdrawal,
      index,
    }))
    .sort((a, b) => a.time.minus(b.time).toNumber());
  return pendingWithdrawalsWithIndexes;
};

/**
 * Fetch all votes
 */
export const getVotes = async (address: string): Promise<CeloVote[]> => {
  const election = await celoKit().contracts.getElection();
  const voter = await election.getVoter(await voteSignerAccount(address));
  const activates = await getActivateTransactionObjects(address);
  const activatableValidatorGroups = activates.map(
    (activate) => activate.txo.arguments[0]
  );

  const votes: CeloVote[] = [];
  voter.votes.forEach((vote) => {
    let activeVoteRevokable = true;
    if (vote.pending.gt(0)) {
      // If there's a pending vote, it has to be revoked first
      activeVoteRevokable = false;
      votes.push({
        validatorGroup: vote.group,
        amount: vote.pending,
        // Not all pending votes can be activated, 24h has to pass
        activatable: activatableValidatorGroups.includes(vote.group),
        revokable: true,
        index: 0,
        type: "pending",
      });
    }
    if (vote.active.gt(0))
      votes.push({
        validatorGroup: vote.group,
        amount: vote.active,
        activatable: false,
        revokable: activeVoteRevokable,
        index: 1,
        type: "active",
      });
  });

  return votes;
};

const getActivateTransactionObjects = async (address: string) => {
  const election = await celoKit().contracts.getElection();
  return await election.activate(await voteSignerAccount(address));
};

/**
 * Fetch and cache address of a vote signer account
 * Cache it for 1h since vote signer is usually the same account as our address
 */
export const voteSignerAccount = makeLRUCache(
  async (address: string): Promise<string> => {
    const accounts = await celoKit().contracts.getAccounts();
    return await accounts.voteSignerToAccount(address);
  },
  (address) => address,
  {
    ttl: 60 * 60 * 1000, // 1 hour
  }
);
