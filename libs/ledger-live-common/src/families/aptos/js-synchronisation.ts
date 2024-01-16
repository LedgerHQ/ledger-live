import { from, firstValueFrom } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import type { AptosAccount as Account } from "./types";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";

import { encodeAccountId } from "../../account";

import { AptosAPI } from "./api";
import { txsToOps } from "./logic";
import Aptos from "./hw-app-aptos";

const getAccountShape: GetAccountShape = async info => {
  const {
    address,
    initialAccount: _initialAccount,
    derivationMode,
    currency,
    deviceId,
    derivationPath,
  } = info;
  const initialAccount = _initialAccount as Account;

  let publicKey = initialAccount?.publicKey;
  if (!initialAccount?.publicKey && typeof deviceId === "string") {
    const result = await firstValueFrom(
      withDevice(deviceId)(transport => from(new Aptos(transport).getAddress(derivationPath))),
    );
    publicKey = Buffer.from(result.publicKey).toString("hex");
  }

  const oldOperations = initialAccount?.operations || [];
  const startAt = (oldOperations[0]?.extra as any)?.version;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  const aptosClient = new AptosAPI(currency.id);
  const { balance, transactions, blockHeight, delegatedAmount } = await aptosClient.getAccountInfo(
    address,
    startAt,
  );

  const newOperations = txsToOps(info, accountId, transactions);
  const operations = mergeOps(oldOperations, newOperations);

  const shape: Partial<Account> = {
    type: "Account",
    id: accountId,
    publicKey,
    balance: balance,
    spendableBalance: balance,
    delegatedAmount,
    operations,
    operationsCount: operations.length,
    blockHeight,
    lastSyncDate: new Date(),
  };

  return shape;
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape, shouldMergeOps: false });
