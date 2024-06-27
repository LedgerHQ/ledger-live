import { decodeAccountId, findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { Account } from "@ledgerhq/types-live";
import {
  SendMode,
  Address as TonAddress,
  WalletContractV4,
  comment,
  internal,
  toNano,
} from "@ton/ton";
import BigNumber from "bignumber.js";
import { estimateFee } from "./bridge/bridgeHelpers/api";
import { MAX_FEE_TOKEN_TRANSFER } from "./constants";
import { TonComment, TonPayloadFormat, TonTransaction, Transaction } from "./types";

export const isAddressValid = (recipient: string) => {
  try {
    return Boolean(
      (TonAddress.isRaw(recipient) || TonAddress.isFriendly(recipient)) &&
        TonAddress.parse(recipient),
    );
  } catch {
    return false;
  }
};

export const addressesAreEqual = (addr1: string, addr2: string) => {
  try {
    return (
      isAddressValid(addr1) &&
      isAddressValid(addr2) &&
      TonAddress.parse(addr1).equals(TonAddress.parse(addr2))
    );
  } catch {
    return false;
  }
};

export const buildTonTransaction = (
  transaction: Transaction,
  seqno: number,
  account: Account,
): TonTransaction => {
  const { subAccountId, useAllAmount, amount, comment, recipient } = transaction;
  let recipientParsed = recipient;
  // if recipient is not valid calculate fees with empty address
  // we handle invalid addresses in account bridge
  try {
    TonAddress.parse(recipientParsed);
  } catch {
    recipientParsed = new TonAddress(0, Buffer.alloc(32)).toRawString();
  }

  // if there is a sub account, the transaction is a token transfer
  const subAccount = findSubAccountById(account, subAccountId ?? "");

  const finalAmount = subAccount
    ? toNano(MAX_FEE_TOKEN_TRANSFER) // for commission fees, excess will be returned
    : useAllAmount
      ? BigInt(0)
      : BigInt(amount.toFixed());
  const to = subAccount ? subAccount.token.contractAddress : recipientParsed;
  const tonTransaction: TonTransaction = {
    to: TonAddress.parse(to),
    seqno,
    amount: finalAmount,
    bounce: TonAddress.isFriendly(to) ? TonAddress.parseFriendly(to).isBounceable : true,
    timeout: getTransferExpirationTime(),
    sendMode: useAllAmount && !subAccount
      ? SendMode.CARRY_ALL_REMAINING_BALANCE
      : SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
  };

  if (comment.text.length) {
    tonTransaction.payload = { type: "comment", text: comment.text };
  }
  
  if (subAccount) {
    tonTransaction.payload = {
      type: "jetton-transfer",
      queryId: BigInt(1),
      amount: BigInt(amount.toFixed()),
      destination: TonAddress.parse(recipientParsed),
      responseDestination: TonAddress.parse(account.freshAddress),
      customPayload: null,
      forwardAmount: BigInt(1),
      forwardPayload: null,
    };
  }
  return tonTransaction;
};

// max length is 120 and only ascii allowed
export const commentIsValid = (msg: TonComment) =>
  !msg.isEncrypted && msg.text.length <= 120 && /^[\x20-\x7F]*$/.test(msg.text);

// 1 minute
export const getTransferExpirationTime = () => Math.floor(Date.now() / 1000 + 60);

export const getTonEstimatedFees = async (
  account: Account,
  needsInit: boolean,
  tx: TonTransaction,
) => {
  const { xpubOrAddress: pubKey } = decodeAccountId(account.id);
  if (pubKey.length !== 64) throw Error("[ton] pubKey can't be found");
  if (tx.payload && tx.payload?.type !== "comment") {
    throw Error("[ton] payload kind not expected");
  }
  const contract = WalletContractV4.create({ workchain: 0, publicKey: Buffer.from(pubKey, "hex") });
  const transfer = contract.createTransfer({
    seqno: tx.seqno,
    secretKey: Buffer.alloc(64), // secretKey set to 0, signature is not verified
    messages: [
      internal({
        bounce: tx.bounce,
        to: tx.to,
        value: tx.amount,
        body: tx.payload?.text ? comment(tx.payload.text) : undefined,
      }),
    ],
    sendMode: tx.sendMode,
  });
  const initCode = needsInit ? contract.init.code.toBoc().toString("base64") : undefined;
  const initData = needsInit ? contract.init.data.toBoc().toString("base64") : undefined;
  const fee = await estimateFee(
    account.freshAddress,
    transfer.toBoc().toString("base64"),
    initCode,
    initData,
  );
  return BigNumber(fee.fwd_fee + fee.gas_fee + fee.in_fwd_fee + fee.storage_fee);
};

export const getLedgerTonPath = (path: string): number[] => {
  const numPath: number[] = [];
  if (!path) throw Error("[ton] Path is empty");
  if (path.startsWith("m/")) path = path.slice(2);
  const pathEntries = path.split("/");
  if (pathEntries.length !== 6) throw Error(`[ton] Path length is not right ${path}`);
  for (const entry of pathEntries) {
    if (!entry.endsWith("'")) throw Error(`[ton] Path entry is not hardened ${path}`);
    const num = parseInt(entry.slice(0, entry.length - 1));
    if (!Number.isInteger(num) || num < 0 || num >= 0x80000000)
      throw Error(`[ton] Path entry is not right ${path}`);
    numPath.push(num);
  }
  return numPath;
};

export const isJettonTransfer = (payload: TonPayloadFormat): boolean =>
  payload.type === "jetton-transfer";
