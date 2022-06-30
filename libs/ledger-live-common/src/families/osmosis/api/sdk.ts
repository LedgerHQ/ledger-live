import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { encodeOperationId } from "../../../operation";
import { Operation, OperationType } from "../../../types";
import { CosmosAPI } from "../../cosmos/api/Cosmos";
import {
  OsmosisDistributionParams,
  OsmosisEpochProvisions,
  OsmosisEpochs,
  OsmosisMintParams,
  OsmosisPool,
  OsmosisTotalSupply,
} from "../OsmosisSupplyTypes";
import {
  OsmosisAccountTransaction,
  OsmosisTransactionTypeEnum,
  OsmosisAmount,
  OsmosisCurrency,
  OsmosisSendEventContent,
  OsmosisEventNestedContent,
  OsmosisStakingEventContent,
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
const convertTransactionToOperation = (
  accountId: string,
  type: OperationType,
  // eventContent: any, //todo fix this type
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
function getOperationValue(
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
            // Check sub array exists. Sub array contains transactions messages. If there isn't one, skip
            if (!Object.prototype.hasOwnProperty.call(events[j], "sub")) {
              break;
            }

            const eventContent: OsmosisSendEventContent[] = events[j].sub;
            // Check that sub array is not empty
            if (!(eventContent.length > 0)) break;

            // Check eventContent contains at least one entry of type "send" using find() and retrieve it.
            // More in depth: find() retrieves the (first) message, which contains sender, recipient and amount info
            // First message because typically "send" transactions only have one sender and one recipient
            // If no messages are found, skips the transaction altogether
            const sendEvent = eventContent.find(
              (event) => event.type[0] === OsmosisTransactionTypeEnum.Send
            );
            if (sendEvent == null) break;
            const type = getOperationType(sendEvent, address);
            const senders = sendEvent.sender[0]?.account?.id
              ? [sendEvent.sender[0]?.account?.id]
              : [];
            const recipients = sendEvent.recipient[0]?.account?.id
              ? [sendEvent.recipient[0]?.account?.id]
              : [];
            const fee = new BigNumber(
              getMicroOsmoAmount(accountTransactions[i].transaction_fee)
            );
            operations.push(
              convertTransactionToOperation(
                accountId,
                type,
                getOperationValue(sendEvent, type, fee),
                accountTransactions[i],
                senders,
                recipients,
                { memo }
              )
            );
            break;
          }

          // TODO, refactor this terrible code duplication
          case OsmosisTransactionTypeEnum.Delegate: {
            if (!Object.prototype.hasOwnProperty.call(events[j], "sub")) {
              break;
            }
            const eventContent: OsmosisStakingEventContent[] = events[j].sub;
            if (!(eventContent.length > 0)) break;
            const event = eventContent.find(
              (event) => event.type[0] === OsmosisTransactionTypeEnum.Delegate
            );
            if (event == null) break;
            const type = "DELEGATE";
            const extra = {
              memo: memo,
              validators: [
                {
                  address: event.node.validator[0].id,
                  amount: new BigNumber(
                    getMicroOsmoAmount([event.amount.delegate])
                  ),
                },
              ],
            };
            operations.push(
              convertTransactionToOperation(
                accountId,
                type,
                extra.validators[0].amount,
                accountTransactions[i],
                [],
                [],
                extra
              )
            );
            break;
          }
          // TODO, refactor this terrible code duplication
          case OsmosisTransactionTypeEnum.Redelegate: {
            if (!Object.prototype.hasOwnProperty.call(events[j], "sub")) {
              break;
            }
            const eventContent: OsmosisStakingEventContent[] = events[j].sub;
            if (!(eventContent.length > 0)) break;
            const event = eventContent.find(
              (event) => event.type[0] === OsmosisTransactionTypeEnum.Redelegate
            );
            if (event == null) break;
            const type = "REDELEGATE";
            const extra = {
              memo: memo,
              validators: [
                {
                  address: event.node.validator_destination[0].id,
                  amount: new BigNumber(
                    getMicroOsmoAmount([event.amount.delegate])
                  ),
                },
              ],
              sourceValidator: event.node.validator_source[0].id,
            };
            operations.push(
              convertTransactionToOperation(
                accountId,
                type,
                extra.validators[0].amount,
                accountTransactions[i],
                [],
                [],
                extra
              )
            );
            // Handle rewards that get withdrawn automatically when a redelegation happens
            let amount = new BigNumber(0);
            if (event.transfers != null) {
              if (event.transfers.reward) {
                amount = getMicroOsmoAmount(event.transfers.reward[0].amounts);
              }
            }
            if (amount.gt(0)) {
              operations.push(
                convertTransactionToOperation(
                  accountId,
                  "REWARD",
                  amount,
                  accountTransactions[i],
                  [],
                  [],
                  extra
                )
              );
            }
            break;
          }
          case OsmosisTransactionTypeEnum.Undelegate: {
            if (!Object.prototype.hasOwnProperty.call(events[j], "sub")) {
              break;
            }
            const eventContent: OsmosisStakingEventContent[] = events[j].sub;
            if (!(eventContent.length > 0)) break;
            const event = eventContent.find(
              (event) => event.type[0] === OsmosisTransactionTypeEnum.Undelegate
            );

            if (event == null) break;
            const type = "UNDELEGATE";
            const extra = {
              memo: memo,
              validators: [
                {
                  address: event.node.validator[0].id,
                  amount: new BigNumber(
                    getMicroOsmoAmount([event.amount.undelegate])
                  ),
                },
              ],
            };
            operations.push(
              convertTransactionToOperation(
                accountId,
                type,
                extra.validators[0].amount,
                accountTransactions[i],
                [],
                [],
                extra
              )
            );
            break;
          }
          case OsmosisTransactionTypeEnum.Reward: {
            if (!Object.prototype.hasOwnProperty.call(events[j], "sub")) {
              break;
            }
            const eventContent: OsmosisStakingEventContent[] = events[j].sub;
            if (!(eventContent.length > 0)) break;
            const event = eventContent.find(
              (event) => event.type[0] === OsmosisTransactionTypeEnum.Reward
            );

            if (event == null) break;
            const type = "REWARD";
            let amount = new BigNumber(0);
            if (event.transfers != null) {
              if (event.transfers.reward) {
                amount = getMicroOsmoAmount(event.transfers.reward[0].amounts);
              }
            }
            const extra = {
              memo: memo,
              validators: [
                {
                  address: event.node.validator[0].id,
                  amount,
                },
              ],
            };
            operations.push(
              convertTransactionToOperation(
                accountId,
                type,
                amount,
                accountTransactions[i],
                [],
                [],
                extra
              )
            );
            break;
          }
          default:
            break;
        }
      }
    }

    return operations;
  };

  queryMintParams = async (): Promise<OsmosisMintParams> => {
    const { data } = await network({
      method: "GET",
      url: `${this._defaultEndpoint}/osmosis/mint/v1beta1/params`,
    });

    // const {
    //   mint_denom,
    //   genesis_epoch_provisions,
    //   epoch_identifier,
    //   reduction_period_in_epochs,
    //   reduction_factor,
    //   distribution_proportions,
    //   weighted_developer_rewards_receivers,
    // } = data?.params;

    // return {
    //   mint_denom,
    //   genesis_epoch_provisions,
    //   epoch_identifier,
    //   reduction_period_in_epochs,
    //   reduction_factor,
    //   distribution_proportions: {
    //     ...distribution_proportions,
    //   },
    //   weighted_developer_rewards_receivers,
    // };
    return data?.params;
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

  queryEpochProvisions = async (): Promise<OsmosisEpochProvisions> => {
    const { data: epochProvisions } = await network({
      method: "GET",
      url: `${this._defaultEndpoint}/osmosis/mint/v1beta1/epoch_provisions`,
    });
    return epochProvisions;
  };

  queryEpochs = async (): Promise<OsmosisEpochs> => {
    const { data: epochs } = await network({
      method: "GET",
      url: `${this._defaultEndpoint}/osmosis/epochs/v1beta1/epochs`,
    });
    return epochs;
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
