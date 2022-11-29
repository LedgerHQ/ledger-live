import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { encodeOperationId } from "../../../operation";
import { Operation, OperationType } from "@ledgerhq/types-live";
import { CosmosAPI } from "../../cosmos/api/Cosmos";
import { CosmosDelegationInfo } from "../../cosmos/types";
import {
  OsmosisDistributionParams,
  OsmosisPool,
  OsmosisTotalSupply,
} from "../OsmosisSupplyTypes";
import {
  OsmosisAccountTransaction,
  OsmosisAmount,
  OsmosisCurrency,
  OsmosisEventNestedContent,
  OsmosisSendEventContent,
  OsmosisStakingEventContent,
  OsmosisTransactionTypeEnum,
} from "./sdk.types";

export const nodeEndpoint = getEnv("API_OSMOSIS_NODE").replace(/\/$/, "");
const indexerEndpoint = getEnv("API_OSMOSIS_INDEXER").replace(/\/$/, "");

/**
 * Returns true if account is the signer
 */
function isSender(content: OsmosisEventNestedContent, addr: string): boolean {
  return content.account.id === addr;
}

/**
 * Map transaction to an Operation Type
 */
function getOperationType(
  eventContent: OsmosisSendEventContent,
  addr: string
): OperationType {
  return isSender(eventContent.sender[0], addr) ? "OUT" : "IN";
}

/**
 * Map a send transaction as returned by the indexer to a Ledger Live Operation
 */
export const convertTransactionToOperation = (
  accountId: string,
  type: OperationType,
  value: BigNumber,
  transaction: OsmosisAccountTransaction,
  senders: string[] = [],
  recipients: string[] = [],
  extra: Record<string, any>
): Operation => {
  return {
    id: encodeOperationId(accountId, transaction.hash, type),
    accountId,
    fee: new BigNumber(getMicroOsmoAmount(transaction.transaction_fee)),
    value,
    type,
    hash: transaction.hash,
    blockHash: transaction.block_hash,
    blockHeight: transaction.height,
    date: new Date(transaction.time),
    senders,
    recipients,
    hasFailed: transaction.has_errors,
    extra,
  };
};

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
export function getOperationValue(
  eventContent: OsmosisSendEventContent,
  type: string,
  fee: BigNumber
): BigNumber {
  let amount: BigNumber;
  switch (type) {
    // Per operation.ts, in "OUT" case, it includes the fees. in "IN" case, it excludes them.
    case "OUT":
      amount = BigNumber.sum(
        getMicroOsmoAmount(eventContent.sender[0]?.amounts),
        fee
      );
      break;
    case "IN":
      amount = getMicroOsmoAmount(eventContent.recipient[0]?.amounts);
      break;
    default:
      // defaults to received funds (i.e. no fee is added)
      // amount = getMicroOsmoAmount(eventContent.recipient[0]?.amounts);
      amount = new BigNumber(0);
  }
  return amount;
}

/**
 * Extract only the amount from a list of type OsmosisAmount
 */
export const getMicroOsmoAmount = (amounts: OsmosisAmount[]): BigNumber => {
  return amounts.reduce(
    (result, current) =>
      current.currency === OsmosisCurrency
        ? result.plus(new BigNumber(current.numeric))
        : result,
    new BigNumber(0)
  );
};

export class OsmosisAPI extends CosmosAPI {
  protected _defaultEndpoint: string = nodeEndpoint;
  protected _namespace = "osmosis";
  private _defaultTransactionsLimit = 100;

  getOperations = async (
    accountId: string,
    address: string,
    startDate: Date | null,
    startAt = 0,
    transactionsLimit: number = this._defaultTransactionsLimit
  ): Promise<Operation[]> => {
    const now = new Date().toISOString();
    const operations: Operation[] = [];

    const { data: accountTransactions } = await network({
      method: "POST",
      url: `${indexerEndpoint}/transactions_search/`,
      data: {
        network: "osmosis",
        // type: [OsmosisTransactionTypeEnum.Redelegate], // if no type is specified, all transaction types will be returned
        account: [address],
        before_time: now,
        after_time: startDate !== null ? startDate.toISOString() : null,
        limit: transactionsLimit,
        offset: startAt,
      },
    });

    if (!accountTransactions || !accountTransactions.length) {
      return operations;
    }

    for (let i = 0; i < accountTransactions.length; i++) {
      const events = accountTransactions[i].events;
      const memo: string = accountTransactions[i].memo || "";
      for (let j = 0; j < events.length; j++) {
        const transactionType = events[j].kind ? events[j].kind : "n/a";
        switch (
          // Example: "send". See: OsmosisTransactionTypeEnum.
          // Note: "send" means all transactions where some party was sending some OSMO,
          // which means it shouldn't be interpreted as OUT transactions. See isSender()
          // for context on how we determine if a "send" transaction is IN or OUT.
          transactionType
        ) {
          case OsmosisTransactionTypeEnum.Send: {
            const operation = await this.convertSendTransactionToOperation(
              accountId,
              address,
              events[j],
              accountTransactions[i],
              memo
            );
            if (operation != null) {
              operations.push(operation);
            }
            break;
          }

          case OsmosisTransactionTypeEnum.Delegate: {
            const ops = await this.convertDelegateTransactionToOperation(
              accountId,
              events[j],
              accountTransactions[i],
              memo
            );
            if (ops.length > 0) {
              ops.forEach((op) => operations.push(op));
            }
            break;
          }

          case OsmosisTransactionTypeEnum.Redelegate: {
            const ops = await this.convertRedelegateTransactionToOperation(
              accountId,
              events[j],
              accountTransactions[i],
              memo
            );
            if (ops.length > 0) {
              ops.forEach((op) => operations.push(op));
            }
            break;
          }
          case OsmosisTransactionTypeEnum.Undelegate: {
            const ops = await this.convertUndelegateTransactionToOperation(
              accountId,
              events[j],
              accountTransactions[i],
              memo
            );
            if (ops.length > 0) {
              ops.forEach((op) => operations.push(op));
            }
            break;
          }
          case OsmosisTransactionTypeEnum.Reward: {
            // For the time being we'll be creating duplicate ops for the edge case of
            // rewards txs that contain multiple claim messages.
            // The idea is that a few duplicate operations won't affect performance
            // significantly, and the duplicate will be removed anyways by mergeOps in js-sync.
            // If this doesn't work then simply add a check here to see if there's already
            // an operation in the operations[] array with the current tx hash.

            const ops = await this.convertRewardTransactionToOperation(
              accountId,
              accountTransactions[i],
              memo
            );
            if (ops.length > 0) {
              ops.forEach((op) => operations.push(op));
            }
            break;
          }
          default:
            break;
        }
      }
    }

    return operations;
  };

  convertSendTransactionToOperation = async (
    accountId: string,
    address: string,
    event: any,
    tx: OsmosisAccountTransaction,
    memo: string
  ): Promise<Operation | undefined> => {
    // Check "sub" array exists. The "sub" array contains transactions messages. If there isn't one, skip the tx
    if (!Object.prototype.hasOwnProperty.call(event, "sub")) {
      return;
    }

    const eventContent: OsmosisSendEventContent[] = event.sub;
    // Check that sub array is not empty
    if (!(eventContent.length > 0)) return;

    // Check eventContent contains at least one entry of type "send" using find() and retrieve it.
    // find() retrieves the (first) message, which contains sender, recipient and amount info
    // We get get the first message because typically "send" transactions only have one sender and one recipient
    // If no messages are found, skip the tx
    const sendEvent = eventContent.find(
      (event) => event.type[0] === OsmosisTransactionTypeEnum.Send
    );
    if (sendEvent == null) return;
    const type = getOperationType(sendEvent, address);
    const senders = sendEvent.sender[0]?.account?.id
      ? [sendEvent.sender[0]?.account?.id]
      : [];
    const recipients = sendEvent.recipient[0]?.account?.id
      ? [sendEvent.recipient[0]?.account?.id]
      : [];
    const fee = new BigNumber(getMicroOsmoAmount(tx.transaction_fee));
    return convertTransactionToOperation(
      accountId,
      type,
      getOperationValue(sendEvent, type, fee),
      tx,
      senders,
      recipients,
      { memo }
    );
  };

  convertDelegateTransactionToOperation = async (
    accountId: string,
    event: any,
    tx: OsmosisAccountTransaction,
    memo: string
  ): Promise<Operation[]> => {
    const ops: Operation[] = [];

    if (!Object.prototype.hasOwnProperty.call(event, "sub")) {
      return ops;
    }
    const eventContent: OsmosisStakingEventContent[] = event.sub;
    if (!(eventContent.length > 0)) return ops;
    const delegateEvent = eventContent.find(
      (event) => event.type[0] === OsmosisTransactionTypeEnum.Delegate
    );
    if (delegateEvent == null) return ops;
    const type = "DELEGATE";
    const extra = {
      memo: memo,
      validators: [
        {
          address: delegateEvent.node.validator[0].id,
          amount: new BigNumber(
            getMicroOsmoAmount([delegateEvent.amount.delegate])
          ),
        },
      ],
      autoClaimedRewards: this.calculateAutoClaimedRewards(tx).toString(),
    };

    ops.push(
      convertTransactionToOperation(
        accountId,
        type,
        extra.validators[0].amount,
        tx,
        [],
        [],
        extra
      )
    );
    return ops;
  };

  calculateAutoClaimedRewards = (tx: OsmosisAccountTransaction): BigNumber => {
    //  These types are the only types for which auto claim rewards are supported
    const SUPPORTED_TYPES = [
      OsmosisTransactionTypeEnum.Delegate,
      OsmosisTransactionTypeEnum.Redelegate,
      OsmosisTransactionTypeEnum.Undelegate,
    ];
    let totalRewardsAmount = new BigNumber(0);
    tx.events.forEach((event) => {
      if (Object.prototype.hasOwnProperty.call(event, "sub")) {
        const eventContent: OsmosisStakingEventContent[] =
          event.sub as OsmosisStakingEventContent[];
        if (eventContent.length > 0) {
          const rewardEvent = eventContent[0];
          if (
            rewardEvent != null &&
            SUPPORTED_TYPES.includes(rewardEvent.type[0])
          ) {
            let amount = new BigNumber(0);
            if (rewardEvent.transfers != null) {
              if (rewardEvent.transfers.reward) {
                amount = getMicroOsmoAmount(
                  rewardEvent.transfers.reward[0].amounts
                );
                totalRewardsAmount = totalRewardsAmount.plus(amount);
              }
            }
          }
        }
      }
    });
    return totalRewardsAmount;
  };

  convertRedelegateTransactionToOperation = async (
    accountId: string,
    event: any,
    tx: OsmosisAccountTransaction,
    memo: string
  ): Promise<Operation[]> => {
    const ops: Operation[] = [];

    if (!Object.prototype.hasOwnProperty.call(event, "sub")) {
      return ops;
    }
    const eventContent: OsmosisStakingEventContent[] = event.sub;
    if (!(eventContent.length > 0)) return ops;
    const redelegEvent = eventContent.find(
      (event) => event.type[0] === OsmosisTransactionTypeEnum.Redelegate
    );
    if (redelegEvent == null) return ops;
    const type = "REDELEGATE";
    const extra = {
      memo: memo,
      validators: [
        {
          address: redelegEvent.node.validator_destination[0].id,
          amount: new BigNumber(
            getMicroOsmoAmount([redelegEvent.amount.delegate])
          ),
        },
      ],
      sourceValidator: redelegEvent.node.validator_source[0].id,
      autoClaimedRewards: this.calculateAutoClaimedRewards(tx).toString(),
    };

    ops.push(
      convertTransactionToOperation(
        accountId,
        type,
        extra.validators[0].amount,
        tx,
        [],
        [],
        extra
      )
    );
    return ops;
  };

  convertUndelegateTransactionToOperation = async (
    accountId: string,
    event: any,
    tx: OsmosisAccountTransaction,
    memo: string
  ): Promise<Operation[]> => {
    const ops: Operation[] = [];

    if (!Object.prototype.hasOwnProperty.call(event, "sub")) {
      return ops;
    }
    const eventContent: OsmosisStakingEventContent[] = event.sub;
    if (!(eventContent.length > 0)) return ops;
    const undelegEvent = eventContent.find(
      (event) => event.type[0] === OsmosisTransactionTypeEnum.Undelegate
    );
    if (undelegEvent == null) return ops;
    const type = "UNDELEGATE";
    const extra = {
      memo: memo,
      validators: [
        {
          address: undelegEvent.node.validator[0].id,
          amount: new BigNumber(
            getMicroOsmoAmount([undelegEvent.amount.undelegate])
          ),
        },
      ],
      autoClaimedRewards: this.calculateAutoClaimedRewards(tx).toString(),
    };

    ops.push(
      convertTransactionToOperation(
        accountId,
        type,
        extra.validators[0].amount,
        tx,
        [],
        [],
        extra
      )
    );
    return ops;
  };

  convertRewardTransactionToOperation = async (
    accountId: string,
    tx: OsmosisAccountTransaction,
    memo: string
  ): Promise<Operation[]> => {
    const ops: Operation[] = [];

    let totalRewardsAmount = new BigNumber(0);
    const rewardValidators: CosmosDelegationInfo[] = [];
    tx.events.forEach((event) => {
      if (!Object.prototype.hasOwnProperty.call(event, "sub")) {
        return ops;
      }
      const eventContent: OsmosisStakingEventContent[] =
        event.sub as OsmosisStakingEventContent[];
      if (!(eventContent.length > 0)) return ops;
      const rewardEvent = eventContent.find(
        (event) => event.type[0] === OsmosisTransactionTypeEnum.Reward
      );
      if (rewardEvent == null) return ops;
      let amount = new BigNumber(0);
      if (rewardEvent.transfers != null) {
        if (rewardEvent.transfers.reward) {
          amount = getMicroOsmoAmount(rewardEvent.transfers.reward[0].amounts);
          totalRewardsAmount = totalRewardsAmount.plus(amount);
          rewardValidators.push({
            address: rewardEvent.node.validator[0].id,
            amount,
          });
        }
      }
    });
    const type = "REWARD";
    const extra = {
      memo: memo,
      validators: rewardValidators,
    };
    ops.push(
      convertTransactionToOperation(
        accountId,
        type,
        totalRewardsAmount,
        tx,
        [],
        [],
        extra
      )
    );
    return ops;
  };

  queryTotalSupply = async (
    minDenomUnit: string
  ): Promise<OsmosisTotalSupply> => {
    const { data } = await network({
      method: "GET",
      url: `${this._defaultEndpoint}/cosmos/bank/v1beta1/supply/${minDenomUnit}`,
    });
    const { amount } = data;
    return { ...amount };
  };

  queryPool = async (): Promise<OsmosisPool> => {
    const { data } = await network({
      method: "GET",
      url: `${this._defaultEndpoint}/cosmos/staking/v1beta1/pool`,
    });
    const { pool } = data;
    return { ...pool };
  };

  queryDistributionParams = async (): Promise<OsmosisDistributionParams> => {
    const { data } = await network({
      method: "GET",
      url: `${this._defaultEndpoint}/cosmos/distribution/v1beta1/params`,
    });
    const { params } = data;
    return { ...params };
  };
}

export const osmosisAPI = new OsmosisAPI();
