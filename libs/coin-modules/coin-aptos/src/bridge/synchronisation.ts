import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { AptosAPI } from "../api";
import { txsToOps } from "./logic";
import type { AptosAccount } from "../types";

export const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, currency, derivationMode, rest } = info;

  const publicKey =
    rest?.publicKey || (initialAccount && decodeAccountId(initialAccount.id).xpubOrAddress);

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey || address,
    derivationMode,
  });

  // "xpub" field is used to store publicKey to simulate transaction during sending tokens.
  // We can't get access to the Nano X via bluetooth on the step of simulation
  // but we need public key to simulate transaction.
  // "xpub" field is used because this field exists in ledger operation type
  const xpub = initialAccount?.xpub || publicKey || "";

  const oldOperations = initialAccount?.operations || [];
  const startAt = (oldOperations[0]?.extra as any)?.version;

  const aptosClient = new AptosAPI(currency.id);
  const { balance, transactions, blockHeight } = await aptosClient.getAccountInfo(address, startAt);

  const newOperations = txsToOps(info, accountId, transactions);
  const operations = mergeOps(oldOperations, newOperations);

  const shape: Partial<AptosAccount> = {
    type: "Account",
    id: accountId,
    xpub,
    balance: balance,
    spendableBalance: balance,
    operations,
    operationsCount: operations.length,
    blockHeight,
    lastSyncDate: new Date(),
  };

  return shape;
};
