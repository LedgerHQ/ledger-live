import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { encodeOperationId } from "../../../operation";
import { Operation, OperationType } from "../../../types";
import { CosmosAPI } from "../../cosmos/api/Cosmos";
import {
  OsmosisAccountTransaction,
  OsmosisAccountTransactionTypeEnum,
  OsmosisAmount,
  OsmosisCurrency,
  OsmosisEventContent,
  OsmosisEventNestedContent,
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
  eventContent: OsmosisEventContent,
  addr: string
): OperationType {
  return isSender(eventContent.sender[0], addr) ? "OUT" : "IN";
}

/**
 * Map a send transaction as returned by the indexer to a Ledger Live Operation
 */
const convertTransactionToOperation = (
  accountId: string,
  addr: string,
  eventContent: OsmosisEventContent,
  transaction: OsmosisAccountTransaction,
  memo: string
): Operation => {
  const type = getOperationType(eventContent, addr);
  const fee = new BigNumber(getMicroOsmoAmount(transaction.transaction_fee));
  const senders = eventContent.sender[0]?.account?.id
    ? [eventContent.sender[0]?.account?.id]
    : [];
  const recipients = eventContent.recipient[0]?.account?.id
    ? [eventContent.recipient[0]?.account?.id]
    : [];
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
    extra: { memo },
  };
};

/**
 * Map transaction to a correct Operation Value (affecting account balance)
 */
function getOperationValue(
  eventContent: OsmosisEventContent,
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
      amount = getMicroOsmoAmount(eventContent.recipient[0]?.amounts);
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
      const memo = accountTransactions[i].memo;
      const memoTransaction = memo || "";
      for (let j = 0; j < events.length; j++) {
        const transactionType = events[j].kind ? events[j].kind : "n/a";
        switch (
          // Example: "send". See: OsmosisAccountTransactionTypeEnum.
          // Note: "send" means all transactions where some party was sending some OSMO,
          // which means it shouldn't be interpreted as OUT transactions. See isSender()
          // for context on how we determine if a "send" transaction is IN or OUT.
          transactionType
        ) {
          case OsmosisAccountTransactionTypeEnum.Send: {
            // Check sub array exists. Sub array contains transactions messages. If there isn't one, skip
            if (!Object.prototype.hasOwnProperty.call(events[j], "sub")) {
              break;
            }

            const eventContent: OsmosisEventContent[] = events[j].sub;
            // Check that sub array is not empty
            if (!(eventContent.length > 0)) break;

            // Check eventContent contains at least one entry of type "send" using find() and retrieve it.
            // More in depth: find() retrieves the (first) message, which contains sender, recipient and amount info
            // First message because typically "send" transactions only have one sender and one recipient
            // If no messages are found, skips the transaction altogether
            const sendEvent = eventContent.find(
              (event) =>
                event.type[0] === OsmosisAccountTransactionTypeEnum.Send
            );
            if (sendEvent == null) break;
            operations.push(
              convertTransactionToOperation(
                accountId,
                address,
                sendEvent,
                accountTransactions[i],
                memoTransaction
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
