import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { encodeOperationId } from "../../../operation";
import { Operation, OperationType } from "../../../types";
import { CosmosAPI } from "../../cosmos/api/Cosmos";
import {
  OsmosisAccountTransaction,
  OsmosisTransactionTypeEnum,
  OsmosisAmount,
  OsmosisCurrency,
  OsmosisSendEventContent,
  OsmosisEventNestedContent,
  OsmosisStakingEventContent,
} from "./sdk.types";

const nodeEndpoint = getEnv("API_OSMOSIS_NODE").replace(/\/$/, "");
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
  eventContent: any, //todo fix this type
  transaction: OsmosisAccountTransaction,
  senders: string[] = [],
  recipients: string[] = [],
  extra: Record<string, any>
): Operation => {
  const fee = new BigNumber(getMicroOsmoAmount(transaction.transaction_fee));
  return {
    id: encodeOperationId(accountId, transaction.hash, type),
    accountId,
    fee,
    value: getOperationValue(eventContent, type, fee),
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
    case "DELEGATE":
      // per cosmos/js-synchronization, this is BigNumber(fees)
      amount = fee;
      break;
    case "REDELEGATE":
      // per cosmos/js-synchronization, this is BigNumber(fees)
      amount = fee;
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
        // type: ["begin_redelegate"],       // if no type is specified, all transaction types will be returned
        account: [address],
        before_time: now,
        after_time: startDate !== null ? startDate.toISOString() : null,
        limit: transactionsLimit,
        offset: startAt,
      },
    });

    if (!accountTransactions.length) {
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
          // case OsmosisTransactionTypeEnum.Delegate: {
          //   const ttt = accountTransactions[i];

          //   if (
          //     attributes.amount &&
          //     attributes.amount.indexOf(currency.units[1].code) != -1
          //   ) {
          //     op.type = "DELEGATE";
          //     op.value = new BigNumber(fees);
          //     op.extra.validators.push({
          //       address: attributes.validator,
          //       amount: attributes.amount.replace(currency.units[1].code, ""),
          //     });
          //   }
          //   break;
          // }
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
            operations.push(
              convertTransactionToOperation(
                accountId,
                type,
                sendEvent,
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
            console.log("event is: ", event);
            if (event == null) break;
            const type = "DELEGATE";
            const extra = {
              memo: memo,
              validators: {
                address: event.node.validator, // TODO this is very temporary
                amount: new BigNumber(
                  getMicroOsmoAmount([event.amount.delegate])
                ),
              },
            };
            operations.push(
              convertTransactionToOperation(
                accountId,
                type,
                event,
                accountTransactions[i],
                [],
                [],
                extra
              )
            );
            break;
          }
          // TODO, refactor this terrible code duplication
          case OsmosisTransactionTypeEnum.BeginRedelegate: {
            if (!Object.prototype.hasOwnProperty.call(events[j], "sub")) {
              break;
            }
            const eventContent: OsmosisStakingEventContent[] = events[j].sub;
            if (!(eventContent.length > 0)) break;
            const event = eventContent.find(
              (event) =>
                event.type[0] === OsmosisTransactionTypeEnum.BeginRedelegate
            );
            if (event == null) break;
            const type = "REDELEGATE";
            const extra = {
              memo: memo,
              validators: {
                address: event.node.validator, // TODO this is very temporary
                amount: new BigNumber(
                  getMicroOsmoAmount([event.amount.delegate])
                ),
              },
            };
            operations.push(
              convertTransactionToOperation(
                accountId,
                type,
                event,
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
}

export const osmosisAPI = new OsmosisAPI();
