import { from, firstValueFrom } from "rxjs";
import { withDevice } from "../../hw/deviceAccess";
import type { GetAccountShape } from "../../bridge/jsHelpers";
import type { AptosAccount } from "./types";
import { makeSync, makeScanAccounts, mergeOps } from "../../bridge/jsHelpers";

import { encodeAccountId, decodeAccountId } from "../../account";

import { AptosAPI } from "./api";
import { txsToOps } from "./logic";
import Aptos from "./hw-app-aptos";

const getAccountShape: GetAccountShape = async info => {
  const { address, initialAccount, derivationMode, currency, deviceId, derivationPath } = info;

  // "xpub" field is used to store publicKey to simulate transaction during sending tokens.
  // We can't get access to the Nano X via bluetooth on the step of simulation
  // but we need public key to simulate transaction.
  // "xpub" field is used because this field exists in ledger operation type
  let xpub = initialAccount?.xpub;
  if (!initialAccount?.xpub && typeof deviceId === "string") {
    const result = await firstValueFrom(
      withDevice(deviceId)(transport => from(new Aptos(transport).getAddress(derivationPath))),
    );
    xpub = Buffer.from(result.publicKey).toString("hex");
  }
  if (!xpub && initialAccount?.id) {
    const { xpubOrAddress } = decodeAccountId(initialAccount.id);
    xpub = xpubOrAddress;
  }
  if (!xpub) {
    // This is the corner case. We don't expect this happens
    throw new Error("Unable to retrieve public key");
  }

  const oldOperations = initialAccount?.operations || [];
  const startAt = (oldOperations[0]?.extra as any)?.version;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: xpub as string,
    derivationMode,
  });

  const aptosClient = new AptosAPI(currency.id);
  const { balance, transactions, blockHeight, delegatedAmount } = await aptosClient.getAccountInfo(
    address,
    startAt,
  );

  const newOperations = txsToOps(info, accountId, transactions);
  const operations = mergeOps(oldOperations, newOperations);

  const shape: Partial<AptosAccount> = {
    type: "Account",
    id: accountId,
    xpub,
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
