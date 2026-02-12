import { CraftedTransaction, TransactionIntent } from "@ledgerhq/coin-framework/lib/api/types";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { APTOS_ASSET_ID, type TOKEN_TYPE } from "../constants";
import type { AptosAPI } from "../network";
import buildTransaction, { isTokenType } from "./buildTransaction";
import createTransaction from "./createTransaction";

export async function craftTransaction(
  aptosClient: AptosAPI,
  transactionIntent: TransactionIntent,
): Promise<CraftedTransaction> {
  const newTx = createTransaction();
  newTx.amount = BigNumber(transactionIntent.amount.toString());
  newTx.recipient = transactionIntent.recipient;
  newTx.mode = transactionIntent.type;

  const account = {
    freshAddress: transactionIntent.sender,
    xpub: transactionIntent.senderPublicKey,
    subAccounts: new Array<TokenAccount>(),
  } as Account;

  let tokenType: TOKEN_TYPE | undefined;
  const contractAddress = getContractAddress(transactionIntent);

  if (transactionIntent.asset.type !== "native") {
    tokenType = transactionIntent.asset.type as TOKEN_TYPE;
  }

  const aptosTx = await buildTransaction(
    account,
    newTx,
    aptosClient,
    contractAddress,
    tokenType ?? undefined,
  );

  return { transaction: aptosTx.bcsToHex().toString() };
}

function getContractAddress(txIntent: TransactionIntent): string {
  if (
    txIntent.asset.type !== "native" &&
    isTokenType(txIntent.asset.type as string) &&
    "assetReference" in txIntent.asset
  ) {
    return txIntent.asset.assetReference as string;
  }

  return APTOS_ASSET_ID;
}
