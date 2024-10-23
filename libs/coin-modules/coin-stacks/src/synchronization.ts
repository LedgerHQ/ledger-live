import invariant from "invariant";
import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { getAddressFromPublicKey } from "@stacks/transactions";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { mapTxToOps, mapPendingTxToOps, reconciliatePublicKey } from "./bridge/utils/misc";
import {
  fetchBalances,
  fetchBlockHeight,
  fetchFullMempoolTxs,
  fetchFullTxs,
} from "./bridge/utils/api";
import { GetAccountShape, makeSync } from "@ledgerhq/coin-framework/bridge/jsHelpers";

export const getAccountShape: GetAccountShape = async info => {
  const { initialAccount, currency, rest = {}, derivationMode } = info;
  // for bridge tests specifically the `rest` object is empty and therefore the publicKey is undefined
  // reconciliatePublicKey tries to get pubKey from rest object and then from accountId
  const pubKey = reconciliatePublicKey(rest.publicKey, initialAccount);
  invariant(pubKey, "publicKey is required");

  const accountId: string = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: pubKey,
    derivationMode,
  });

  const address = getAddressFromPublicKey(pubKey);

  const blockHeight = await fetchBlockHeight();
  const balanceResp = await fetchBalances(address);
  const rawTxs = await fetchFullTxs(address);
  const mempoolTxs = await fetchFullMempoolTxs(address);

  const balance = new BigNumber(balanceResp.balance);
  let spendableBalance = new BigNumber(balanceResp.balance);
  for (const tx of mempoolTxs) {
    spendableBalance = spendableBalance
      .minus(new BigNumber(tx.fee_rate))
      .minus(new BigNumber(tx.token_transfer.amount));
  }

  const pendingOperations = mempoolTxs.flatMap(mapPendingTxToOps(accountId, address));

  const result: Partial<Account> = {
    id: accountId,
    xpub: pubKey,
    freshAddress: address,
    balance,
    spendableBalance,
    operations: pendingOperations.concat(rawTxs.flatMap(mapTxToOps(accountId, address))),
    blockHeight: blockHeight.chain_tip.block_height,
  };

  return result;
};

export const sync = makeSync({ getAccountShape });
