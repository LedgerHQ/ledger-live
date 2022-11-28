import { BigNumber } from "bignumber.js";
import network from "../../../network";
import { getEnv } from "../../../env";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "../../../operation";
import { CeloValidatorGroup, FigmentIndexerTransaction } from "../types";
import { isDefaultValidatorGroup } from "../logic";
import { celoKit } from "./sdk";

const DEFAULT_TRANSACTIONS_LIMIT = 200;
const getUrl = (route): string => `${getEnv("API_CELO_INDEXER")}${route || ""}`;

// Indexer returns both account data and transactions in one call.
// Transactions are just limited, there's no block height offset
const fetchAccountDetails = async (
  address: string,
  transactionsLimit: number = DEFAULT_TRANSACTIONS_LIMIT
) => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/account_details/${address}?limit=${transactionsLimit}`),
  });
  return data;
};

const fetchStatus = async () => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/status`),
  });
  return data;
};

const fetchValidatorGroups = async () => {
  const { data } = await network({
    method: "GET",
    url: getUrl(`/validator_groups`),
  });
  return data.items;
};

const getOperationType = (type: string): OperationType => {
  switch (type) {
    case "InternalTransferSent":
      return "OUT";
    case "InternalTransferReceived":
      return "IN";
    case "GoldLocked":
      return "LOCK";
    case "GoldUnlocked":
      return "UNLOCK";
    case "GoldWithdrawn":
      return "WITHDRAW";
    case "ValidatorGroupVoteCastSent":
      return "VOTE";
    case "ValidatorGroupActiveVoteRevokedSent":
      return "REVOKE";
    case "ValidatorGroupPendingVoteRevokedSent":
      return "REVOKE";
    case "ValidatorGroupVoteActivatedSent":
      return "ACTIVATE";
    case "AccountCreated":
      return "REGISTER";
    case "AccountSlashed":
      return "SLASH";
    default:
      return "NONE";
  }
};

const transactionToOperation = (
  address: string,
  accountId: string,
  transaction: FigmentIndexerTransaction
): Operation => {
  const type: OperationType = getOperationType(transaction.kind);
  const hasFailed = transaction.data?.success
    ? !transaction.data?.success
    : false;
  const data = transaction.data;
  const sender = data?.Account || data?.from;
  const recipient = data?.Group || data?.to || data?.Raw?.address;
  const fee = new BigNumber(transaction.data?.gas_used || 0).times(
    new BigNumber(transaction.data?.gas_price || 0)
  );

  const value = [
    "LOCK",
    "UNLOCK",
    "ACTIVATE",
    "VOTE",
    "REVOKE",
    "REGISTER",
  ].includes(type)
    ? new BigNumber(fee)
    : new BigNumber(transaction.amount);

  return {
    id: encodeOperationId(accountId, transaction.transaction_hash, type),
    hash: transaction.transaction_hash,
    accountId,
    fee,
    value,
    type,
    blockHeight: transaction.height,
    date: new Date(transaction.time),
    senders: sender ? [sender] : [],
    recipients: recipient ? [recipient] : [],
    hasFailed,
    blockHash: null,
    extra: {
      celoOperationValue: new BigNumber(transaction.amount),
      ...(["ACTIVATE", "VOTE", "REVOKE"].includes(type)
        ? {
            celoSourceValidator: recipient,
          }
        : {}),
    },
  };
};

export const getAccountDetails = async (
  address: string,
  accountId: string
): Promise<{
  blockHeight: any;
  balance: BigNumber;
  spendableBalance: BigNumber;
  operations: Operation[];
  lockedBalance: BigNumber;
  nonvotingLockedBalance: BigNumber;
}> => {
  const accountDetails = await fetchAccountDetails(address);
  const spendableBalance = new BigNumber(accountDetails.gold_balance);
  const lockedBalance = new BigNumber(accountDetails.total_locked_gold);
  const nonvotingLockedBalance = new BigNumber(
    accountDetails.total_nonvoting_locked_gold
  );
  const balance = spendableBalance.plus(lockedBalance);
  const indexerStatus = await fetchStatus();
  const kit = celoKit();
  const lockedGold = await kit.contracts.getLockedGold();

  const allTransactions = accountDetails.internal_transfers
    .filter(
      (transfer) =>
        transfer.data?.to != lockedGold.address &&
        transfer.data?.from != lockedGold.address
    )
    .concat(accountDetails.transactions);

  const operations: Operation[] = allTransactions.map(
    (transaction: FigmentIndexerTransaction) =>
      transactionToOperation(address, accountId, transaction)
  );

  return {
    blockHeight: indexerStatus.last_indexed_height,
    balance,
    spendableBalance,
    operations,
    lockedBalance,
    nonvotingLockedBalance,
  };
};

export const getValidatorGroups = async (): Promise<CeloValidatorGroup[]> => {
  const validatorGroups = await fetchValidatorGroups();

  const result = validatorGroups.map((validatorGroup) => ({
    address: validatorGroup.address,
    name: validatorGroup.name || validatorGroup.address,
    votes: new BigNumber(validatorGroup.active_votes).plus(
      new BigNumber(validatorGroup.pending_votes)
    ),
  }));
  return customValidatorGroupsOrder(result);
};

const customValidatorGroupsOrder = (validatorGroups): CeloValidatorGroup[] => {
  const defaultValidatorGroup = validatorGroups.find(isDefaultValidatorGroup);

  const sortedValidatorGroups = [...validatorGroups]
    .sort((a, b) => b.votes.minus(a.votes))
    .filter((group) => !isDefaultValidatorGroup(group));

  return defaultValidatorGroup
    ? [defaultValidatorGroup, ...sortedValidatorGroups]
    : sortedValidatorGroups;
};
