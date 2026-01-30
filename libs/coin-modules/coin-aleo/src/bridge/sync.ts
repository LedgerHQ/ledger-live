import BigNumber from "bignumber.js";
import invariant from "invariant";
import { type GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { decodeAccountId, encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { Account, Operation } from "@ledgerhq/types-live";

export const getAccountShape: GetAccountShape<Account> = async infos => {
  const { initialAccount, address, derivationMode, currency, index } = infos;
  let viewKey: string | undefined;

  if (initialAccount) {
    viewKey = decodeAccountId(initialAccount.id).customData;
    invariant(viewKey, `aleo: viewKey is missing in ${address} initialAccount`);
  }

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
    ...(viewKey && {
      customData: viewKey,
    }),
  });

  let balance = new BigNumber(0);
  const operations: Operation[] = [];
  const blockHeight = 1;

  // mock some operations for the first account to allow e2e test
  if (index === 0) {
    balance = balance.plus(1);
    const mockHash = "mockmockmockmockmockmockmockmockmockmock";
    const type = "IN";

    operations.push({
      id: encodeOperationId(accountId, mockHash, type),
      accountId,
      type,
      hash: mockHash,
      senders: ["aleo1mock"],
      recipients: [address],
      date: new Date(),
      blockHeight,
      blockHash: "abc",
      fee: new BigNumber(0),
      value: new BigNumber(1),
      extra: {},
    });
  }

  return {
    type: "Account",
    id: accountId,
    balance,
    spendableBalance: balance,
    blockHeight,
    operations,
    operationsCount: operations.length,
    lastSyncDate: new Date(),
  };
};

export const sync = makeSync({
  getAccountShape,
});
