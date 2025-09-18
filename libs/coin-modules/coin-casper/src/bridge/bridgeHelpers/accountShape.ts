import flatMap from "lodash/flatMap";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { fetchBalance, fetchBlockHeight, fetchAccountStateInfo, fetchTxs } from "../../api/index";
import { mapTxToOps } from "./txn";
import { ITxnHistoryData } from "../../api/types";

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

  const { purseUref, accountHash } = await fetchAccountStateInfo(address);

  const blockHeight = await fetchBlockHeight();

  const balance = purseUref ? await fetchBalance(purseUref) : new BigNumber(0);
  const txs: ITxnHistoryData[] = purseUref ? await fetchTxs(address) : [];

  return {
    id: accountId,
    balance,
    spendableBalance: balance,
    operations: flatMap(txs, mapTxToOps(accountId, accountHash ?? "")),
    blockHeight,
  };
};
