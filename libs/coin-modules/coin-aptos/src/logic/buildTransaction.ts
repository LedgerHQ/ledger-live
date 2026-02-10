import type { InputEntryFunctionData, RawTransaction } from "@aptos-labs/ts-sdk";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import type { Account } from "@ledgerhq/types-live";
import { APTOS_ASSET_ID, TOKEN_TYPE } from "../constants";
import type { AptosAPI } from "../network";
import type { Transaction } from "../types";
import { normalizeTransactionOptions } from "./normalizeTransactionOptions";

const buildTransaction = async (
  account: Account,
  transaction: Transaction,
  aptosClient: AptosAPI,
  contractAddress?: string,
  tokenType?: TOKEN_TYPE,
): Promise<RawTransaction> => {
  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");

  const payloadContracAddress = subAccount ? subAccount.token.contractAddress : contractAddress;
  const payloadTokenType = (subAccount?.token?.tokenType as TOKEN_TYPE) ?? tokenType;

  const txPayload = getPayload({
    transaction,
    tokenType: payloadTokenType,
    contractAddress: payloadContracAddress,
  });

  const txOptions = normalizeTransactionOptions(transaction.options);

  const tx = await aptosClient.generateTransaction(account.freshAddress, txPayload, txOptions);

  return tx;
};

const getPayload = ({
  transaction,
  tokenType,
  contractAddress,
}: {
  transaction: Transaction;
  tokenType: TOKEN_TYPE;
  contractAddress: string | undefined;
}): InputEntryFunctionData => {
  const { amount, recipient, mode } = transaction;

  switch (mode) {
    case "stake":
      return {
        function: "0x1::delegation_pool::add_stake",
        typeArguments: [],
        functionArguments: [recipient, amount.toString()],
      };
    case "unstake":
      return {
        function: "0x1::delegation_pool::unlock",
        typeArguments: [],
        functionArguments: [recipient, amount.toString()],
      };
    case "restake":
      return {
        function: "0x1::delegation_pool::reactivate_stake",
        typeArguments: [],
        functionArguments: [recipient, amount.toString()],
      };
    case "withdraw":
      return {
        function: "0x1::delegation_pool::withdraw",
        typeArguments: [],
        functionArguments: [recipient, amount.toString()],
      };
    case "send":
      if (tokenType !== undefined && !isTokenType(tokenType)) {
        throw new Error(`Token type ${tokenType} not supported`);
      }

      if (tokenType === TOKEN_TYPE.FUNGIBLE_ASSET) {
        return {
          function: "0x1::primary_fungible_store::transfer",
          typeArguments: ["0x1::fungible_asset::Metadata"],
          functionArguments: [contractAddress, recipient, amount.toString()],
        };
      }
  }

  return {
    function: "0x1::aptos_account::transfer_coins",
    typeArguments: [contractAddress ?? APTOS_ASSET_ID],
    functionArguments: [recipient, amount.toString()],
  };
};

// FIXME: terminology overlop, using tokentype here when AssetInfo refers to `standard`
export const isTokenType = (value: string): boolean => {
  return Object.values(TOKEN_TYPE).includes(value as TOKEN_TYPE);
};

export default buildTransaction;
