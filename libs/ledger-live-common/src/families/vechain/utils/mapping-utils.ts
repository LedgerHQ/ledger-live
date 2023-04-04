import vip180 from "../contracts/abis/VIP180";
import { Operation } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { EventLog, TransferLog } from "../api/types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

// TODO: Currently hardcoding the fee to 0
export const mapVetTransfersToOperations = (
  txs: TransferLog[],
  accountId: string,
  addr: string
): Operation[] => {
  return txs.map((tx) => {
    return {
      id: encodeOperationId(
        accountId,
        tx.meta.txID,
        tx.recipient === addr.toLowerCase() ? "IN" : "OUT"
      ),
      hash: tx.meta.txID,
      type: tx.recipient === addr.toLowerCase() ? "IN" : "OUT",
      value: new BigNumber(tx.amount),
      fee: new BigNumber(0),
      senders: [tx.sender],
      recipients: [tx.recipient],
      blockHeight: tx.meta.blockNumber,
      blockHash: tx.meta.blockID,
      accountId,
      date: new Date(tx.meta.blockTimestamp * 1000),
      extra: {},
    };
  });
};

// TODO: Currently hardcoding the fee to 0
export const mapTokenTransfersToOperations = (
  evnts: EventLog[],
  accountId: string,
  addr: string
): Operation[] => {
  return evnts.map((evnt) => {
    const decoded = vip180.TransferEvent.decode(evnt.data, evnt.topics);
    return {
      id: evnt.meta.txID,
      hash: evnt.meta.txID,
      type: decoded.to === addr.toLowerCase() ? "IN" : "OUT",
      value: new BigNumber(decoded.value),
      fee: new BigNumber(0),
      senders: [decoded.from],
      recipients: [decoded.to],
      blockHeight: evnt.meta.blockNumber,
      blockHash: evnt.meta.blockID,
      accountId,
      date: new Date(evnt.meta.blockTimestamp * 1000),
      extra: {},
    };
  });
};

/**
 * Scale the number up by the specified number of decimal places
 * @param val - the value to scale up (a number or string representation of a number)
 * @param scaleDecimal - the number of decimals to scale up by
 * @param roundDecimal - the number of decimals to round the result to
 * @param roundingStrategy - what strategy to use when rounding. Based on the strategies defined in `bignumber.js`. Default strategy is ROUND_HALF_UP
 * @returns the scaled up result as a string
 */
export const scaleNumberUp = (
  val: BigNumber.Value,
  scaleDecimal: number,
  roundDecimal = 0,
  roundingStrategy: BigNumber.RoundingMode = BigNumber.ROUND_HALF_UP
): string => {
  if (scaleDecimal === 0) return new BigNumber(val).toFixed();
  if (scaleDecimal < 0)
    throw Error("Decimal value must be greater than or equal to 0");
  const valBn = new BigNumber(val);
  if (valBn.isNaN()) throw Error("The value provided is NaN.");

  const amount = valBn.times(`1${"0".repeat(scaleDecimal)}`);

  if (scaleDecimal === roundDecimal) return amount.toFixed();

  return amount.toFixed(roundDecimal, roundingStrategy);
};
