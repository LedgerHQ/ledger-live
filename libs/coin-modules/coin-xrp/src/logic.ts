import BigNumber from "bignumber.js";
import { Account, Operation } from "@ledgerhq/types-live";
import { isValidClassicAddress } from "ripple-address-codec";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { XrplOperation } from "./api/types";
import { getAccountInfo } from "./api";

export const NEW_ACCOUNT_ERROR_MESSAGE = "actNotFound";
export const UINT32_MAX = new BigNumber(2).pow(32).minus(1);

/** @see https://xrpl.org/basic-data-types.html#specifying-time */
const RIPPLE_EPOCH = 946684800;

export const validateTag = (tag: BigNumber) => {
  return (
    !tag.isNaN() && tag.isFinite() && tag.isInteger() && tag.isPositive() && tag.lte(UINT32_MAX)
  );
};

export const getNextValidSequence = async (account: Account) => {
  const accInfo = await getAccountInfo(account.freshAddress, true);
  return accInfo.account_data.Sequence;
};

function isRecipientValid(recipient: string): boolean {
  return isValidClassicAddress(recipient);
}

const recipientIsNew = async (recipient: string): Promise<boolean> => {
  if (!isRecipientValid(recipient)) return false;

  const info = await getAccountInfo(recipient);
  if (info.error === NEW_ACCOUNT_ERROR_MESSAGE) {
    return true;
  }
  return false;
};

const cacheRecipientsNew: Record<string, boolean> = {};
export const cachedRecipientIsNew = async (recipient: string) => {
  if (recipient in cacheRecipientsNew) return cacheRecipientsNew[recipient];
  cacheRecipientsNew[recipient] = await recipientIsNew(recipient);
  return cacheRecipientsNew[recipient];
};
export const removeCachedRecipientIsNew = (recipient: string) => {
  delete cacheRecipientsNew[recipient];
};

const XrplOperationToLiveOperation =
  (accountId: string, address: string) =>
  ({
    meta: { delivered_amount },
    tx: { Fee, hash, inLedger, date, Account, Destination, Sequence },
  }: XrplOperation) => {
    const type = Account === address ? "OUT" : "IN";
    let value =
      delivered_amount && typeof delivered_amount === "string"
        ? new BigNumber(delivered_amount)
        : new BigNumber(0);
    const feeValue = new BigNumber(Fee);

    if (type === "OUT") {
      if (!Number.isNaN(feeValue)) {
        value = value.plus(feeValue);
      }
    }

    const toEpochDate = (RIPPLE_EPOCH + date) * 1000;

    const op: Operation = {
      id: encodeOperationId(accountId, hash, type),
      hash: hash,
      accountId: accountId,
      type,
      value,
      fee: feeValue,
      blockHash: null,
      blockHeight: inLedger,
      senders: [Account],
      recipients: [Destination],
      date: new Date(toEpochDate),
      transactionSequenceNumber: Sequence,
      extra: {},
    };

    return op;
  };

export const filterOperations = (
  transactions: XrplOperation[],
  accountId: string,
  address: string,
) => {
  return transactions
    .filter(
      ({ tx, meta }: XrplOperation) =>
        tx.TransactionType === "Payment" && typeof meta.delivered_amount === "string",
    )
    .map(XrplOperationToLiveOperation(accountId, address))
    .filter((op): op is Operation => Boolean(op));
};
