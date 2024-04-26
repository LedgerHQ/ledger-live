import { decodeAccountId, findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { Account, Address } from "@ledgerhq/types-live";
import {
  Cell,
  SendMode,
  Address as TonAddress,
  WalletContractV4,
  beginCell,
  comment,
  external,
  internal,
  storeMessage,
  toNano,
} from "@ton/ton";
import BigNumber from "bignumber.js";
import { estimateFee } from "./bridge/bridgeHelpers/api";
import { TonComment, TonHwParams, Transaction } from "./types";

export const getAddress = (a: Account): Address => ({
  address: a.freshAddress,
  derivationPath: a.freshAddressPath,
});

export const isAddressValid = (recipient: string) =>
  TonAddress.isRaw(recipient) || TonAddress.isFriendly(recipient);

export const addressesAreEqual = (addr1: string, addr2: string) =>
  isAddressValid(addr1) &&
  isAddressValid(addr2) &&
  TonAddress.parse(addr1).equals(TonAddress.parse(addr2));

export const transactionToHwParams = (t: Transaction, seqno: number, a: Account): TonHwParams => {
  let recipient = t.recipient;
  // if recipient is not valid calculate fees with empty address
  // we handle invalid addresses in account bridge
  try {
    TonAddress.parse(recipient);
  } catch {
    recipient = new TonAddress(0, Buffer.alloc(32)).toRawString();
  }

  // if there is a sub account, the transaction is a token transfer
  const subAccount = findSubAccountById(a, t.subAccountId || "");

  const amount = subAccount
    ? toNano("0.05") // for commission fees, excess will be returned
    : t.useAllAmount
    ? BigInt(0)
    : BigInt(t.amount.toFixed());
  const to = subAccount ? subAccount.token.contractAddress : recipient;

  const tonHwParams: TonHwParams = {
    to: TonAddress.parse(to),
    seqno,
    amount,
    bounce: TonAddress.isFriendly(to) ? TonAddress.parseFriendly(to).isBounceable : true,
    timeout: getTransferExpirationTime(),
    sendMode: t.useAllAmount
      ? SendMode.CARRY_ALL_REMAINING_BALANCE
      : SendMode.IGNORE_ERRORS + SendMode.PAY_GAS_SEPARATELY,
  };

  if (t.comment.text.length) {
    tonHwParams.payload = { type: "comment", text: t.comment.text };
  }
  if (subAccount) {
    tonHwParams.payload = {
      type: "jetton-transfer",
      queryId: BigInt(1),
      amount: t.useAllAmount ? BigInt(0) : BigInt(t.amount.toFixed()),
      destination: TonAddress.parse(recipient),
      responseDestination: TonAddress.parse(getAddress(a).address),
      customPayload: null,
      forwardAmount: BigInt(1),
      forwardPayload: null,
    };
  }
  return tonHwParams;
};

export const packTransaction = (a: Account, needsInit: boolean, signature: Cell): string => {
  const { address } = TonAddress.parseFriendly(getAddress(a).address);
  let init: { code: Cell; data: Cell } | null = null;
  if (needsInit) {
    if (a.xpub?.length !== 64) throw Error("[ton] xpub can't be found");
    const wallet = WalletContractV4.create({
      workchain: 0,
      publicKey: Buffer.from(a.xpub, "hex"),
    });
    init = wallet.init;
  }
  const ext = external({ to: address, init, body: signature });
  return beginCell().store(storeMessage(ext)).endCell().toBoc().toString("base64");
};

// max length is 120 and only ascii allowed
export const commentIsValid = (msg: TonComment) =>
  !msg.isEncrypted && msg.text.length <= 120 && /^[\x20-\x7F]*$/.test(msg.text);

// 1 minute
export const getTransferExpirationTime = () => Math.floor(Date.now() / 1000 + 60);

export const getTonEstimatedFees = async (a: Account, needsInit: boolean, tx: TonHwParams) => {
  const { xpubOrAddress: pubKey } = decodeAccountId(a.id);
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
    getAddress(a).address,
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
