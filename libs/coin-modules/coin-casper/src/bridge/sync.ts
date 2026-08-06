import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import flatMap from "lodash/flatMap";
import { fetchBalance, fetchBlockHeight, fetchAccountStateInfo, fetchTxs } from "../network/api";
import { ITxnHistoryData } from "../types/network";
import { mapTxToOps } from "../logic/listOperations";

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
