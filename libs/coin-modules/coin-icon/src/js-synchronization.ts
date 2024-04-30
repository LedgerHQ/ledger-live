import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";

import { getAccount, getCurrentBlockHeight, getOperations } from "./api";
import BigNumber from "bignumber.js";
import { getDelegation } from "./api/node";
import { IconResources } from "./types";
import { convertICXtoLoop } from "./logic";
import { AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";

export const getAccountShape: GetAccountShape = async (info: AccountShapeInfo) => {
  const { address, initialAccount, currency, derivationMode } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  let blockHeight = 0;
  try {
    const oldOperations = initialAccount?.operations || [];

    const blockHeight = await getCurrentBlockHeight(currency);
    const iconAccount = await getAccount(info.address, currency);

    // Merge new operations with the previously synced ones
    const newOperations = await getOperations(
      accountId,
      address,
      0,
      currency,
      iconAccount?.contract_updated_block - oldOperations.length,
    );
    const operations = mergeOps(oldOperations, newOperations);
    const delegationData = await getDelegation(address, currency);
    const iconResources: IconResources = {
      nonce: 0,
      totalDelegated: delegationData.totalDelegated,
      votingPower: delegationData.votingPower,
    };

    const balance = convertICXtoLoop(iconAccount?.balance || 0);
    const spendableBalance = balance
      .minus(iconResources.totalDelegated)
      .minus(iconResources.votingPower);

    return {
      id: accountId,
      balance,
      spendableBalance,
      operationsCount: operations.length,
      blockHeight,
      iconResources,
      operations,
    };
  } catch (error) {
    return {
      id: accountId,
      blockHeight,
      balance: new BigNumber(0),
      iconResources: {
        nonce: 0,
        totalDelegated: new BigNumber(0),
        votingPower: new BigNumber(0),
      },
    };
  }
};
