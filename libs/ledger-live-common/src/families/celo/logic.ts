import { Account } from "../../types";
import {
  CeloPendingWithdrawal,
  CeloValidatorGroup,
  CeloVote,
  CeloVoteStatus,
} from "./types";
import { BigNumber } from "bignumber.js";

export const PRELOAD_MAX_AGE = 10 * 60 * 1000; // 10 minutes, used for max age in preload strategy
const LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS =
  "0x0861a61Bf679A30680510EcC238ee43B82C5e843";

export const availablePendingWithdrawals = (
  account: Account
): CeloPendingWithdrawal[] => {
  const { pendingWithdrawals } = account.celoResources || {};

  return (pendingWithdrawals || []).filter(
    (withdrawal) => new Date(withdrawal.time.toNumber() * 1000) < new Date()
  );
};

export const withdrawableBalance = (account: Account): BigNumber =>
  availablePendingWithdrawals(account).reduce(
    (sum, withdrawal) => sum.plus(withdrawal.value),
    new BigNumber(0)
  );

export const defaultValidatorGroupAddress = (): string =>
  LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS;

export const isDefaultValidatorGroupAddress = (address: string): boolean =>
  address === LEDGER_BY_FIGMENT_VALIDATOR_GROUP_ADDRESS;

export const isDefaultValidatorGroup = (
  validatorGroup: CeloValidatorGroup
): boolean => isDefaultValidatorGroupAddress(validatorGroup.address);

export const activatableVotes = (account: Account): CeloVote[] => {
  const { votes } = account.celoResources || {};

  return (votes || []).filter((vote) => vote.activatable);
};

export const revokableVotes = (account: Account): CeloVote[] => {
  const { votes } = account.celoResources || {};

  return (votes || []).filter((vote) => vote.revokable);
};

export const getVote = (
  account: Account,
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
