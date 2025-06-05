import type { InputEntryFunctionData, RawTransaction } from "@aptos-labs/ts-sdk";
import type { Account } from "@ledgerhq/types-live";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";
import { APTOS_ASSET_ID, TOKEN_TYPE } from "../constants";
import type { AptosAPI } from "../network";
import { normalizeTransactionOptions } from "./normalizeTransactionOptions";
import type { Transaction } from "../types";
import type BigNumber from "bignumber.js";

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
    amount: transaction.amount,
    recipient: transaction.recipient,
    contractAddress: payloadContracAddress,
    tokenType: payloadTokenType,
  });

  const txOptions = normalizeTransactionOptions(transaction.options);

  const tx = await aptosClient.generateTransaction(account.freshAddress, txPayload, txOptions);

  return tx;
};

const getPayload = (args: {
  amount: BigNumber;
  recipient: string;
  contractAddress?: string | undefined;
  tokenType?: string;
}): InputEntryFunctionData => {
  if (args.tokenType !== undefined && !isTokenType(args.tokenType)) {
    throw new Error(`Token type ${args.tokenType} not supported`);
  }

  if (args.tokenType === TOKEN_TYPE.FUNGIBLE_ASSET) {
    return {
      function: "0x1::primary_fungible_store::transfer",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [args.contractAddress, args.recipient, args.amount.toString()],
    };
  }

  let address = args.contractAddress ?? "";
  if (address === "") {
    address = APTOS_ASSET_ID;
  }

  return {
    function: "0x1::aptos_account::transfer_coins",
    typeArguments: [address],
    functionArguments: [args.recipient, args.amount.toString()],
  };
};

export const isTokenType = (value: string): boolean => {
  return Object.values(TOKEN_TYPE).includes(value as TOKEN_TYPE);
};

export default buildTransaction;
