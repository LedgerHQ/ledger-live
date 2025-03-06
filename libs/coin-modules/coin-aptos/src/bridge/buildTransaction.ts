import { InputEntryFunctionData, RawTransaction } from "@aptos-labs/ts-sdk";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { findSubAccountById, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import { AptosAPI } from "../api";
import { APTOS_ASSET_ID, SUPPORTED_TOKEN_TYPES } from "../constants";
import { normalizeTransactionOptions } from "./logic";
import type { Transaction } from "../types";

const buildTransaction = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
): Promise<RawTransaction> => {
  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");

  const txPayload = getPayload(subAccount, transaction);
  const txOptions = normalizeTransactionOptions(transaction.options);
  const tx = await aptosClient.generateTransaction(account.freshAddress, txPayload, txOptions);

  return tx;
};

const getPayload = (
  tokenAccount: TokenAccount | undefined,
  transaction: Transaction,
): InputEntryFunctionData => {
  if (tokenAccount && isTokenAccount(tokenAccount)) {
    const { tokenType } = tokenAccount.token;

    if (!SUPPORTED_TOKEN_TYPES.includes(tokenType)) {
      throw new Error(`Token type ${tokenType} not supported`);
    }

    if (tokenType === "fungible_asset") {
      return {
        function: `0x1::primary_fungible_store::transfer`,
        typeArguments: ["0x1::fungible_asset::Metadata"],
        functionArguments: [
          [tokenAccount.token.contractAddress],
          transaction.recipient,
          transaction.amount.toString(),
        ],
      };
    }

    if (tokenType === "coin") {
      return {
        function: `0x1::coin::transfer`,
        typeArguments: [tokenAccount.token.contractAddress],
        functionArguments: [transaction.recipient, transaction.amount.toString()],
      };
    }
  }

  return {
    function: "0x1::aptos_account::transfer_coins",
    typeArguments: [APTOS_ASSET_ID],
    functionArguments: [transaction.recipient, transaction.amount.toString()],
  };
};

export default buildTransaction;
