import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { TokenAccount } from "@ledgerhq/types-live";
import { GetAccountShape, makeSync, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { encodeAccountId, areAllOperationsLoaded } from "@ledgerhq/coin-framework/account/index";
import { encodeAddress, isStringHex, reconciliatePublicKey, txToOp } from "./logic";
import api, { fetchAllTransactions } from "../network/tzkt";
import { TezosAccount, TezosOperation } from "../types";

export const getAccountShape: GetAccountShape<TezosAccount> = async ({
  initialAccount,
  rest,
  currency,
  derivationMode,
}) => {
  const publicKey = reconciliatePublicKey(rest?.publicKey, initialAccount);
  invariant(
    isStringHex(publicKey),
    `Invalid public key (${publicKey}). Please reimport your Tezos accounts`,
  );
  const hex = Buffer.from(publicKey, "hex");
  const address = encodeAddress(hex);

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: publicKey,
    derivationMode,
  });

  const initialStableOperations = (
    initialAccount && initialAccount.id === accountId ? initialAccount.operations : []
  ) as TezosOperation[];

  // fetch transactions, incrementally if possible
  const mostRecentStableOperation = initialStableOperations[0];

  const lastId =
    initialAccount && areAllOperationsLoaded(initialAccount) && mostRecentStableOperation
      ? mostRecentStableOperation.extra.id || undefined
      : undefined;

  const apiAccountPromise = api.getAccountByAddress(address);
  const blocksCountPromise = api.getBlockCount();

  const [apiAccount, blockHeight] = await Promise.all([apiAccountPromise, blocksCountPromise]);

  if (apiAccount.type === "empty") {
    return {
      id: accountId,
      xpub: publicKey,
      freshAddress: address,
      blockHeight,
      lastSyncDate: new Date(),
      tezosResources: {
        revealed: false,
        counter: 0,
      },
    };
  }

  const fullySupported = apiAccount.type === "user";

  const apiOperations = fullySupported ? await fetchAllTransactions(address, lastId) : [];

  const { revealed, counter } = apiAccount;

  const tezosResources = {
    revealed,
    counter,
  };

  const balance = new BigNumber(apiAccount.balance);
  const subAccounts: TokenAccount[] = [];

  const newOps = apiOperations
    .map(txToOp({ address, accountId }))
    .filter(Boolean) as unknown as TezosOperation[]; // force cast because `filter(Boolean)` remove undefined and null value

  const operations = mergeOps(initialStableOperations, newOps);

  const accountShape = {
    id: accountId,
    xpub: publicKey,
    freshAddress: address,
    operations,
    balance,
    subAccounts,
    spendableBalance: balance,
    blockHeight,
    lastSyncDate: new Date(),
    tezosResources,
  };

  return accountShape;
};

export const sync = makeSync({ getAccountShape });
