import { flatMap } from "lodash";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { Account } from "@ledgerhq/types-live";
import { encodeAccountId } from "../../../../account";

import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { fetchBalances, fetchBlockHeight, fetchTxs, getAccountStateInfo } from "./network";
import { mapTxToOps } from "./txn";
import { NAccountBalance, LTxnHistoryData } from "./types";

export const getAccountShape: GetAccountShape = async info => {
  const { address, currency, derivationMode } = info;

  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });

  log("debug", `Generation account shape for ${address}`);

  const { purseUref, accountHash } = await getAccountStateInfo(address);

  const blockHeight = await fetchBlockHeight();

  let balance: NAccountBalance, txs: LTxnHistoryData[];
  if (purseUref) {
    balance = await fetchBalances(purseUref);
    txs = await fetchTxs(address);
  } else {
    balance = { balance_value: "0", api_version: "", merkle_proof: "" };
    txs = [];
  }

  const csprBalance = new BigNumber(balance.balance_value);
  const result: Partial<Account> = {
    id: accountId,
    balance: csprBalance,
    spendableBalance: csprBalance,
    operations: flatMap(txs, mapTxToOps(accountId, accountHash ?? "")),
    blockHeight: blockHeight.last_added_block_info.height,
  };

  return result;
};
