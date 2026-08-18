import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/index";
import { GetAccountShape } from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import { log } from "@ledgerhq/logs";
import BigNumber from "bignumber.js";
import flatMap from "lodash/flatMap";
import { fetchBalance, fetchLastBlock, fetchAccountStateInfo, fetchTxs } from "../network/api";
import { ITxnHistoryData } from "../types/network";
import { mapTxToOps } from "../logic/listOperations";
import { getCoinConfig } from "../config";

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

  const config = getCoinConfig();

  const { purseUref, accountHash } = await fetchAccountStateInfo(config, address);

  const { height: blockHeight } = await fetchLastBlock(config);

  const balance = purseUref ? await fetchBalance(config, purseUref) : new BigNumber(0);
  const txs: ITxnHistoryData[] = purseUref ? await fetchTxs(config, address) : [];

  return {
    id: accountId,
    balance,
    spendableBalance: balance,
    operations: flatMap(txs, mapTxToOps(accountId, accountHash ?? "")),
    blockHeight,
  };
};
