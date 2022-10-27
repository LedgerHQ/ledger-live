import { BigNumber } from "bignumber.js";
import { flatMap } from "lodash";
import { encodeAccountId } from "../../account";
import { GetAccountShape } from "../../bridge/jsHelpers";
import { mapTxToOps } from "./bridge/utils/txn";
import {
  fetchBalances,
  fetchBlockHeight,
  fetchTxs,
} from "./bridge/utils/network";

const validHexRegExp = new RegExp(/[0-9A-Fa-f]{6}/g);
const validBase64RegExp = new RegExp(
  /^(?:[A-Za-z\d+/]{4})*(?:[A-Za-z\d+/]{3}=|[A-Za-z\d+/]{2}==)?$/
);

// TODO Filecoin - Use the new package @zondax/ledger-utils instead
export const isNoErrorReturnCode = (code: number): boolean => code === 0x9000;

export const getPath = (path: string): string =>
  path && path.substring(0, 2) !== "m/" ? `m/${path}` : path;

export const isValidHex = (msg: string): boolean => validHexRegExp.test(msg);
export const isValidBase64 = (msg: string): boolean =>
  validBase64RegExp.test(msg);

export const isError = (r: {
  returnCode: number;
  errorMessage: string;
}): void => {
  if (!isNoErrorReturnCode(r.returnCode))
    throw new Error(`${r.returnCode} - ${r.errorMessage}`);
};

export const methodToString = (method: number): string => {
  switch (method) {
    case 0:
      return "Transfer";
    default:
      return "Unknown";
  }
};

export const getBufferFromString = (message: string): Buffer => {
  if (isValidHex(message)) {
    return Buffer.from(message, "hex");
  }

  if (isValidBase64(message)) {
    return Buffer.from(message, "base64");
  }

  return Buffer.from(message);
};

export const getAccountShape: GetAccountShape = async (info) => {
  const { address, currency, derivationMode } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const blockHeight = await fetchBlockHeight();
  const balance = await fetchBalances(address.substring(2));
  const txs = await fetchTxs(address);

  const result = {
    id: accountId,
    balance: new BigNumber(balance.balance_value),
    spendableBalance: new BigNumber(balance.balance_value),
    operations: flatMap(txs, mapTxToOps(accountId, info)),
    blockHeight: blockHeight.last_added_block_info.height,
  };

  return result;
};
