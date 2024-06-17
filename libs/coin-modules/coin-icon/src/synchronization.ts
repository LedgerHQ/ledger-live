import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { mergeOps, AccountShapeInfo } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import type { GetAccountShape } from "@ledgerhq/coin-framework/bridge/jsHelpers";

import { getAccount, getCurrentBlockHeight, getOperations } from "./api";
import BigNumber from "bignumber.js";
import { getDelegation } from "./api/node";
import { IconResources } from "./types";
import { convertICXtoLoop } from "./logic";

export const getAccountShape: GetAccountShape = async (info: AccountShapeInfo) => {
  const { address, initialAccount, currency, derivationMode } = info;
  const accountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode,
  });
  try {
    const oldOperations = initialAccount?.operations || [];
    const blockHeight = await getCurrentBlockHeight(currency);
    const iconAccount = await getAccount(info.address, currency);

    // Merge new operations with the previously synced ones
    const newOperations = await getOperations(
      accountId,
      address,
      0, // skip === 0 is the lastest transaction
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
      balance: new BigNumber(0),
      spendableBalance: new BigNumber(0),
      operationsCount: 0,
      iconResources: {
        nonce: 0,
        totalDelegated: new BigNumber(0),
        votingPower: new BigNumber(0),
      },
      blockHeight: 0,
      operations: [],
    };
  }
};
