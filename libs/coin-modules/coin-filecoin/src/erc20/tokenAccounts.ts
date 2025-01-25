import cbor from "@zondax/cbor";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import { fetchERC20TokenBalance, fetchERC20Transactions } from "../api";
import invariant from "invariant";
import { ERC20Transfer, TxStatus } from "../types";
import { emptyHistoryCache, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { convertAddressFilToEth } from "../network";
import { ethers } from "ethers";
import contractABI from "./ERC20.json";
import { RecipientRequired } from "@ledgerhq/errors";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { AccountType } from "../bridge/utils";
import { valueFromUnit } from "../common-logic/utils";

export const erc20TxnToOperation = (
  tx: ERC20Transfer,
  address: string,
  accountId: string,
  unit: Unit,
): Operation[] => {
  try {
    const { to, from, timestamp, tx_hash, tx_cid, amount, height, status } = tx;
    const value = valueFromUnit(new BigNumber(amount), unit);

    const isSending = address.toLowerCase() === from.toLowerCase();
    const isReceiving = address.toLowerCase() === to.toLowerCase();

    const fee = new BigNumber(0);

    const date = new Date(timestamp * 1000);
    const hash = tx_cid ?? tx_hash;
    const hasFailed = status !== TxStatus.Ok;

    const ops: Operation[] = [];
    if (isSending) {
      ops.push({
        id: encodeOperationId(accountId, hash, "OUT"),
        hash,
        type: "OUT",
        value: value,
        fee,
        blockHeight: height,
        blockHash: "",
        accountId,
        senders: [from],
        recipients: [to],
        date,
        hasFailed,
        extra: {},
      });
    }

    if (isReceiving) {
      ops.push({
        id: encodeOperationId(accountId, hash, "IN"),
        hash,
        type: "IN",
        value,
        fee,
        blockHeight: height,
        blockHash: "",
        accountId,
        senders: [from],
        recipients: [to],
        date,
        hasFailed,
        extra: {},
      });
    }

    invariant(ops, "filecoin operation is not defined");

    return ops;
  } catch (e) {
    log("error", "filecoin error converting erc20 transaction to operation", e);
    return [];
  }
};

export async function buildTokenAccounts(
  filAddr: string,
  parentAccountId: string,
  initialAccount?: Account,
): Promise<TokenAccount[]> {
  try {
    const transfers = await fetchERC20Transactions(filAddr);
    const transfersUntangled: { [addr: string]: ERC20Transfer[] } = transfers.reduce(
      (prev: { [addr: string]: ERC20Transfer[] }, curr: ERC20Transfer) => {
        curr.contract_address = curr.contract_address.toLowerCase();
        if (prev[curr.contract_address]) {
          prev[curr.contract_address] = [...prev[curr.contract_address], curr];
        } else {
          prev[curr.contract_address] = [curr];
        }
        return prev;
      },
      {},
    );

    const subs: TokenAccount[] = [];
    for (const [cAddr, txns] of Object.entries(transfersUntangled)) {
      const token = findTokenByAddressInCurrency(cAddr, "filecoin");
      if (!token) {
        log("error", `filecoin token not found, addr: ${cAddr}`);
        continue;
      }

      const balance = await fetchERC20TokenBalance(filAddr, cAddr);
      const bnBalance = new BigNumber(balance.toString());
      const tokenAccountId = encodeTokenAccountId(parentAccountId, token);

      const operations = txns
        .flatMap(txn => erc20TxnToOperation(txn, filAddr, tokenAccountId, token.units[0]))
        .flat()
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      if (operations.length === 0 && bnBalance.isZero()) {
        continue;
      }

      const maybeExistingSubAccount =
        initialAccount &&
        initialAccount.subAccounts &&
        initialAccount.subAccounts.find(a => a.id === tokenAccountId);

      const sub: TokenAccount = {
        type: AccountType.TokenAccount,
        id: tokenAccountId,
        parentId: parentAccountId,
        token,
        balance: bnBalance,
        spendableBalance: bnBalance,
        operationsCount: txns.length,
        operations,
        pendingOperations: maybeExistingSubAccount ? maybeExistingSubAccount.pendingOperations : [],
        creationDate: operations.length > 0 ? operations[0].date : new Date(),
        swapHistory: maybeExistingSubAccount ? maybeExistingSubAccount.swapHistory : [],
        balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
      };

      subs.push(sub);
    }

    return subs;
  } catch (e) {
    log("error", "filecoin error building token accounts", e);
    return [];
  }
}

export const encodeTxnParams = (abiEncodedParams: string) => {
  log("debug", `filecoin/abiEncodedParams: ${abiEncodedParams}`);
  if (!abiEncodedParams) {
    throw new Error("Cannot encode empty abi encoded params");
  }

  const buffer = Buffer.from(abiEncodedParams.slice(2), "hex"); // buffer/byte array
  const dataEncoded = cbor.encode(buffer);

  return dataEncoded.toString("base64");
};

export const abiEncodeTransferParams = (recipient: string, amount: string) => {
  const contract = new ethers.utils.Interface(contractABI);
  const data = contract.encodeFunctionData("transfer", [recipient, amount]);
  return data;
};

export const generateTokenTxnParams = (recipient: string, amount: BigNumber) => {
  log("debug", "generateTokenTxnParams", { recipient, amount: amount.toString() });

  if (!recipient) {
    throw new RecipientRequired();
  }

  recipient = convertAddressFilToEth(recipient);

  return abiEncodeTransferParams(recipient, amount.toString());
};
