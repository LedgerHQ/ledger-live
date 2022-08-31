import {
  CeloAccount,
  CeloPendingWithdrawal,
  CeloValidatorGroup,
  CeloVote,
  CeloVoteStatus,
  PendingStakingOperationAmounts,
} from "./types";
import { BigNumber } from "bignumber.js";
import { Operation } from "@ledgerhq/types-live";

export const PRELOAD_MAX_AGE = 10 * 60 * 1000; // 10 minutes, used for max age in preload strategy
const LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS =
  "0x0861a61Bf679A30680510EcC238ee43B82C5e843";

export const availablePendingWithdrawals = (
  account: CeloAccount
): CeloPendingWithdrawal[] => {
  const { pendingWithdrawals } = account.celoResources || {};

  return (pendingWithdrawals || []).filter(
    (withdrawal) => new Date(withdrawal.time.toNumber() * 1000) < new Date()
  );
};

export const withdrawableBalance = (account: CeloAccount): BigNumber =>
  availablePendingWithdrawals(account).reduce(
    (sum, withdrawal) => sum.plus(withdrawal.value),
    new BigNumber(0)
  );

export const hasWithdrawableBalance = (account: CeloAccount): boolean =>
  withdrawableBalance(account).isGreaterThan(0);

export const defaultValidatorGroupAddress = (): string =>
  LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS;

export const isDefaultValidatorGroupAddress = (address: string): boolean =>
  address === LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS;

export const isDefaultValidatorGroup = (
  validatorGroup: CeloValidatorGroup
): boolean => isDefaultValidatorGroupAddress(validatorGroup.address);

export const activatableVotes = (account: CeloAccount): CeloVote[] => {
  const { votes } = account.celoResources || {};

  return (votes || []).filter((vote) => vote.activatable);
};

export const hasActivatableVotes = (account: CeloAccount): boolean =>
  activatableVotes(account).length > 0;

export const revokableVotes = (account: CeloAccount): CeloVote[] => {
  const { votes } = account.celoResources || {};

  return (votes || []).filter((vote) => vote.revokable);
};

export const hasRevokableVotes = (account: CeloAccount): boolean =>
  revokableVotes(account).length > 0;

export const getVote = (
  account: CeloAccount,
  validatorGroupAddress: string,
  index: number | null | undefined
): CeloVote | undefined => {
  const { votes } = account.celoResources || {};
  return votes?.find(
    (revoke) =>
      revoke.validatorGroup === validatorGroupAddress && revoke.index == index
  );
};

export const voteStatus = (vote: CeloVote): CeloVoteStatus =>
  vote.type === "pending" && vote.activatable
    ? "awaitingActivation"
    : vote.type;

export const fallbackValidatorGroup = (
  address: string
): CeloValidatorGroup => ({
  address: address,
  name: address,
  votes: new BigNumber(0),
});

export const isAccountRegistrationPending = (
  accountId: string,
  accounts: CeloAccount[]
): boolean => {
  // If there's a pending "REGISTER" operation and the
  // account's registration status is false, then
  // we know that the account is truly not registered yet.
  const account = accounts.find(
    (currentAccount) => accountId === currentAccount.id
  );

  const isAccountRegistrationPending =
    !!account &&
    account.pendingOperations.some(
      (currentAccount) => currentAccount.type === "REGISTER"
    ) &&
    !account.celoResources?.registrationStatus;

  return isAccountRegistrationPending;
};

const isOperationTrulyPending = (
  operation: Operation,
  activeOperations: Operation[]
): boolean => {
  if (
    activeOperations.some(
      (activeOperation) => activeOperation.hash === operation.hash
    )
  ) {
    return false;
  }

  return true;
};

const initialPendingStakingOperationAmounts: PendingStakingOperationAmounts = {
  vote: new BigNumber(0),
  lock: new BigNumber(0),
};

export const getPendingStakingOperationAmounts = (
  account: CeloAccount
): PendingStakingOperationAmounts => {
  const operationAmounts = account.pendingOperations.reduce(
    (acc, currentOperation) => {
      if (
        currentOperation.type !== "VOTE" &&
        currentOperation.type !== "LOCK"
      ) {
        return acc;
      }
      if (isOperationTrulyPending(currentOperation, account.operations)) {
        const value = new BigNumber(currentOperation.value);
        switch (currentOperation.type) {
          case "VOTE":
            return {
              ...acc,
              vote: acc.vote.plus(value),
            };
          case "LOCK":
            return {
              ...acc,
              lock: acc.lock.plus(value),
            };
        }
      }

      return acc;
    },
    initialPendingStakingOperationAmounts
  );

  return operationAmounts;
};

const getValidatorGroupsByVotingActivity = (
  validatorGroups: CeloValidatorGroup[],
  votes: CeloVote[],
  withVotes: boolean
): CeloValidatorGroup[] => {
  return validatorGroups.filter(
    (v) => votes.some((d) => d.validatorGroup === v.address) === withVotes
  );
};

export const getValidatorGroupsWithVotes = (
  validatorGroups: CeloValidatorGroup[],
  votes: CeloVote[] | null
): CeloValidatorGroup[] =>
  getValidatorGroupsByVotingActivity(validatorGroups, votes || [], true);

export const getValidatorGroupsWithoutVotes = (
  validatorGroups: CeloValidatorGroup[],
  votes: CeloVote[] | null = []
): CeloValidatorGroup[] =>
  getValidatorGroupsByVotingActivity(validatorGroups, votes || [], false);
