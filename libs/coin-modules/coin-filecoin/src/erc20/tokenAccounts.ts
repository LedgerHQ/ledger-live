import { emptyHistoryCache, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/index";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { RecipientRequired } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { Account, Operation, TokenAccount } from "@ledgerhq/types-live";
import cbor from "@zondax/cbor";
import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import invariant from "invariant";
import { fetchERC20TokenBalance, fetchERC20TransactionsWithPages } from "../api";
import { AccountType } from "../bridge/utils";
import { convertAddressFilToEth } from "../network";
import { ERC20Transfer, TxStatus } from "../types";
import contractABI from "./ERC20.json";

export const erc20TxnToOperation = (
  tx: ERC20Transfer,
  address: string,
  accountId: string,
): Operation[] => {
  try {
    const { to, from, timestamp, tx_hash, tx_cid, amount, height, status } = tx;
    const txAmount = new BigNumber(amount);

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
        value: txAmount,
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
        value: txAmount,
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
  lastHeight: number,
  parentAccountId: string,
  initialAccount?: Account,
): Promise<TokenAccount[]> {
  try {
    const transfers = await fetchERC20TransactionsWithPages(filAddr, lastHeight);

    if (!transfers.length) {
      return initialAccount?.subAccounts ?? [];
    }

    // Group transfers by contract address (normalized to lowercase)
    const transfersByContract = transfers.reduce<Record<string, ERC20Transfer[]>>(
      (acc, transfer) => {
        const contractAddr = transfer.contract_address.toLowerCase();
        transfer.contract_address = contractAddr;

        if (!acc[contractAddr]) {
          acc[contractAddr] = [];
        }
        acc[contractAddr].push(transfer);
        return acc;
      },
      {},
    );

    // Create lookup map for existing sub-accounts
    const existingSubAccounts = new Map(
      initialAccount?.subAccounts?.map(sa => [sa.token.contractAddress.toLowerCase(), sa]) ?? [],
    );

    // Track which existing accounts we've processed
    const processedContracts = new Set<string>();
    const tokenAccounts: TokenAccount[] = [];

    // Process accounts with new transfers
    for (const [contractAddr, txns] of Object.entries(transfersByContract)) {
      processedContracts.add(contractAddr);

      const token = await getCryptoAssetsStore().findTokenByAddressInCurrency(
        contractAddr,
        "filecoin",
      );
      if (!token) {
        log("error", `filecoin token not found, addr: ${contractAddr}`);
        continue;
      }

      const balance = await fetchERC20TokenBalance(filAddr, contractAddr);
      const bnBalance = new BigNumber(balance);
      const tokenAccountId = encodeTokenAccountId(parentAccountId, token);

      const operations = txns
        .flatMap(txn => erc20TxnToOperation(txn, filAddr, tokenAccountId))
        .flat()
        .sort((a, b) => b.date.getTime() - a.date.getTime());

      // Skip if no operations and zero balance
      if (operations.length === 0 && bnBalance.isZero()) {
        continue;
      }

      const existingAccount = existingSubAccounts.get(contractAddr);

      const tokenAccount: TokenAccount = {
        type: AccountType.TokenAccount,
        id: tokenAccountId,
        parentId: parentAccountId,
        token,
        balance: bnBalance,
        spendableBalance: bnBalance,
        operationsCount: txns.length,
        operations: mergeOps(existingAccount?.operations ?? [], operations),
        pendingOperations: existingAccount?.pendingOperations ?? [],
        creationDate: operations[operations.length - 1]?.date ?? new Date(),
        swapHistory: existingAccount?.swapHistory ?? [],
        balanceHistoryCache: emptyHistoryCache, // calculated in the jsHelpers
      };

      tokenAccounts.push(tokenAccount);
    }

    // Add existing accounts that didn't have new transfers
    for (const [contractAddr, existingAccount] of existingSubAccounts) {
      if (!processedContracts.has(contractAddr)) {
        tokenAccounts.push(existingAccount);
      }
    }

    return tokenAccounts;
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
  const contract = new ethers.Interface(contractABI);
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
