import { decodeAccountId, findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { Account } from "@ledgerhq/types-live";
import {
  Builder,
  SendMode,
  Address as TonAddress,
  WalletContractV4,
  comment,
  internal,
  toNano,
} from "@ton/ton";
import BigNumber from "bignumber.js";
import { estimateFee } from "./bridge/bridgeHelpers/api";
import {
  JettonOpCode,
  MAX_COMMENT_BYTES,
  TOKEN_TRANSFER_FORWARD_AMOUNT,
  TOKEN_TRANSFER_MAX_FEE,
} from "./constants";
import {
  TonCell,
  TonComment,
  TonPayloadFormat,
  TonPayloadJettonTransfer,
  TonTransaction,
  Transaction,
} from "./types";

/**
 * Checks if the given recipient address is valid.
 */
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

/**
 * Compares two addresses to check if they are equal.
 */
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

/**
 * Builds a TonTransaction object based on the given transaction details.
 */
export const buildTonTransaction = (
  transaction: Transaction,
  seqno: number,
  account: Account,
): TonTransaction => {
  const { subAccountId, useAllAmount, amount, comment: commentTx, recipient } = transaction;
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
    ? toNano(TOKEN_TRANSFER_MAX_FEE) // for commission fees, excess will be returned
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
    sendMode:
      useAllAmount && !subAccount
        ? SendMode.CARRY_ALL_REMAINING_BALANCE
        : SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
  };

  if (commentTx.text.length) {
    tonTransaction.payload = { type: "comment", text: commentTx.text };
  }

  if (subAccount) {
    const forwardPayload = commentTx.text.length ? comment(commentTx.text) : null;

    tonTransaction.payload = {
      type: "jetton-transfer",
      queryId: BigInt(0),
      amount: BigInt(amount.toFixed()),
      destination: TonAddress.parse(recipientParsed),
      responseDestination: TonAddress.parse(account.freshAddress),
      customPayload: null,
      forwardAmount: BigInt(TOKEN_TRANSFER_FORWARD_AMOUNT),
      forwardPayload,
    };
  }

  return tonTransaction;
};

/**
 * Validates if the given comment is valid.
 */
export const commentIsValid = (msg: TonComment) =>
  !msg.isEncrypted && msg.text.length <= MAX_COMMENT_BYTES && /^[\x20-\x7F]*$/.test(msg.text);

/**
 * Gets the transfer expiration time.
 */
export const getTransferExpirationTime = () => Math.floor(Date.now() / 1000 + 60);

/**
 * Estimates the fees for a Ton transaction.
 */
export const getTonEstimatedFees = async (
  account: Account,
  needsInit: boolean,
  tx: TonTransaction,
) => {
  const { xpubOrAddress: pubKey } = decodeAccountId(account.id);
  if (pubKey.length !== 64) throw Error("[ton] pubKey can't be found");

  // build body depending the payload type
  let body: TonCell | undefined;
  if (tx.payload) {
    switch (tx.payload.type) {
      case "comment":
        body = comment(tx.payload.text);
        break;
      case "jetton-transfer":
        body = buildTokenTransferBody(tx.payload);
        break;
    }
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
        body,
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

/**
 * Converts a Ledger path string to an array of numbers.length.
 */
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

/**
 * Checks if the given payload is a jetton transfer.
 */
export const isJettonTransfer = (payload: TonPayloadFormat): boolean =>
  payload.type === "jetton-transfer";

/**
 * Builds the body of a token transfer transaction.
 */
function buildTokenTransferBody(params: TonPayloadJettonTransfer): TonCell {
  const { queryId, amount, destination, responseDestination, forwardAmount } = params;
  let forwardPayload = params.forwardPayload;

  let builder = new Builder()
    .storeUint(JettonOpCode.Transfer, 32)
    .storeUint(queryId ?? generateQueryId(), 64)
    .storeCoins(amount)
    .storeAddress(destination)
    .storeAddress(responseDestination)
    .storeBit(false)
    .storeCoins(forwardAmount ?? BigInt(0));

  if (forwardPayload instanceof Uint8Array) {
    forwardPayload = packBytesAsSnake(forwardPayload);
  }

  if (!forwardPayload) {
    builder.storeBit(false);
  } else if (typeof forwardPayload === "string") {
    builder = builder.storeBit(false).storeUint(0, 32).storeBuffer(Buffer.from(forwardPayload));
  } else if (forwardPayload instanceof Uint8Array) {
    builder = builder.storeBit(false).storeBuffer(Buffer.from(forwardPayload));
  } else {
    builder = builder.storeBit(true).storeRef(forwardPayload);
  }

  return builder.endCell();
}

/**
 * Generates a random BigInt of the specified byte length.
 */
function bigintRandom(bytes: number) {
  let value = BigInt(0);
  for (const randomNumber of randomBytes(bytes)) {
    const randomBigInt = BigInt(randomNumber);
    value = (value << BigInt(8)) + randomBigInt;
  }
  return value;
}

/**
 * Generates a random byte array of the specified size.
 */
function randomBytes(size: number) {
  return self.crypto.getRandomValues(new Uint8Array(size));
}

/**
 * Generates a random query ID.
 */
function generateQueryId() {
  return bigintRandom(8);
}

/**
 * Packs a byte array into a TonCell using a snake-like structure.
 */
function packBytesAsSnake(bytes: Uint8Array): TonCell {
  return packBytesAsSnakeCell(bytes);
}

/**
 * Packs a byte array into a TonCell using a snake-like structure.
 */
function packBytesAsSnakeCell(bytes: Uint8Array): TonCell {
  const buffer = Buffer.from(bytes);

  const mainBuilder = new Builder();
  let prevBuilder: Builder | undefined;
  let currentBuilder = mainBuilder;

  for (const [i, byte] of buffer.entries()) {
    if (currentBuilder.availableBits < 8) {
      prevBuilder?.storeRef(currentBuilder);

      prevBuilder = currentBuilder;
      currentBuilder = new Builder();
    }

    currentBuilder = currentBuilder.storeUint(byte, 8);

    if (i === buffer.length - 1) {
      prevBuilder?.storeRef(currentBuilder);
    }
  }

  return mainBuilder.asCell();
}
