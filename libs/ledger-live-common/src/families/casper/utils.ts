import { flatMap } from "lodash";
import { encodeAccountId } from "../../account";
import { GetAccountShape } from "../../bridge/jsHelpers";
import { mapTxToOps } from "./bridge/utils/txn";
import {
  fetchBalances,
  fetchBlockHeight,
  fetchTxs,
  getAccountStateInfo,
} from "./bridge/utils/network";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { LTxnHistoryData, NAccountBalance } from "./bridge/utils/types";
import { CLPublicKey } from "casper-js-sdk";
import { encode, getPubKeySignature } from "./bridge/utils/addresses";
import { Account } from "@ledgerhq/types-live";
import { CASPER_FEES } from "./consts";

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

  log("debug", `Generation account shape for ${address}`);

  const { purseUref, accountHash } = await getAccountStateInfo(address);

  const blockHeight = await fetchBlockHeight();

  let balance: NAccountBalance, txs: LTxnHistoryData[];
  if (purseUref && accountHash) {
    balance = await fetchBalances(purseUref);
    txs = await fetchTxs(accountHash);
  } else {
    balance = { balance_value: "0", api_version: "", merkle_proof: "" };
    txs = [];
  }

  const csprBalance = new BigNumber(balance.balance_value);
  const result: Partial<Account> = {
    id: accountId,
    balance: csprBalance,
    spendableBalance: csprBalance,
    operations: flatMap(txs, mapTxToOps(accountId, accountHash ?? "")),
    blockHeight: blockHeight.last_added_block_info.height,
  };

  return result;
};

export function motesToCSPR(motes: number | string): BigNumber {
  if (!motes) return new BigNumber(0);

  return new BigNumber(motes).div(1000000000);
}

export function csprToMotes(cspr: number | string): BigNumber {
  if (!cspr) return new BigNumber(0);
  return new BigNumber(cspr).multipliedBy(1000000000);
}

export function casperPubKeyToAccountHash(pubKey: string): string {
  const clPubKey = new CLPublicKey(
    Buffer.from(pubKey.substring(2), "hex"),
    getPubKeySignature(pubKey)
  );

  return encode(Buffer.from(clPubKey.toAccountRawHashStr(), "hex"));
}

export function deployHashToString(
  hash: Uint8Array,
  toLowerCase?: boolean
): string {
  const str = encode(Buffer.from(hash));

  if (toLowerCase) return str.toLowerCase();
  return str;
}

export function validateTransferId(id?: string): { isValid: boolean } {
  if (!id || !id.length) return { isValid: true };
  if (/^\d+$/.test(id)) return { isValid: true };

  return { isValid: false };
}

export function getEstimatedFees(): BigNumber {
  return new BigNumber(CASPER_FEES);
}
