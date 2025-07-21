import type { TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import type { AptosAsset } from "../types/assets";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { AptosAPI } from "../network";
import buildTransaction, { isTokenType } from "./buildTransaction";
import createTransaction from "./createTransaction";
import BigNumber from "bignumber.js";
import { APTOS_ASSET_ID, type TOKEN_TYPE } from "../constants";
import type { AptosBalance } from "../types";

export async function craftTransaction(
  aptosClient: AptosAPI,
  transactionIntent: TransactionIntent<AptosAsset>,
): Promise<string> {
  const newTx = createTransaction();
  newTx.amount = BigNumber(transactionIntent.amount.toString());
  newTx.recipient = transactionIntent.recipient;
  newTx.mode = transactionIntent.type;
  newTx.useAllAmount = transactionIntent.amount === BigInt(0);

  const account = {
    freshAddress: transactionIntent.sender,
    xpub: transactionIntent.senderPublicKey,
    subAccounts: new Array<TokenAccount>(),
  } as Account;

  let tokenType: TOKEN_TYPE | undefined;
  const contractAddress = getContractAddress(transactionIntent);
  let balance: AptosBalance | undefined;

  if (newTx.useAllAmount === true) {
    const balances = await aptosClient.getBalances(transactionIntent.sender);
    balance = balances?.find(
      b => b.contractAddress.toLowerCase() === contractAddress?.toLowerCase(),
    );

    if (balance !== undefined) {
      newTx.amount = BigNumber(balance.amount.toString());
    }
  }

  if (transactionIntent.asset.type === "token") {
    tokenType = transactionIntent.asset.standard as TOKEN_TYPE;
  }

  const aptosTx = await buildTransaction(
    account,
    newTx,
    aptosClient,
    contractAddress,
    tokenType ?? undefined,
  );

  return aptosTx.bcsToHex().toString();
}

function getContractAddress(txIntent: TransactionIntent<AptosAsset>): string {
  if (txIntent.asset.type === "token" && isTokenType(txIntent.asset.standard)) {
    return txIntent.asset.contractAddress;
  }

  return APTOS_ASSET_ID;
}
