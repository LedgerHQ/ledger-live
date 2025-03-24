import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation } from "./utils";

export function genericGetAccountShape(network, kind): GetAccountShape {
  return async info => {
    const { address, initialAccount, currency, derivationMode } = info;
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress: address,
      derivationMode,
    });

    const blockInfo = await getAlpacaApi(network, kind).lastBlock();

    const balance = BigNumber((await getAlpacaApi(network, kind).getBalance(address)).toString());

    // TODO
    // const spendableBalance = await getAlpacaApi(network, kind).getSpendableBalance(address);
    const spendableBalance = balance;

    const oldOperations = initialAccount?.operations || [];

    const blockHeight = oldOperations.length ? (oldOperations[0].blockHeight || 0) + 1 : 0;

    const [newOperations, _] = await getAlpacaApi(network, kind).listOperations(address, {
      minHeight: blockHeight,
    });

    const operations = mergeOps(
      oldOperations,
      newOperations.map(op => adaptCoreOperationToLiveOperation(accountId, op)),
    );

    return {
      id: accountId,
      xpub: address,
      blockHeight: blockInfo.height,
      balance,
      spendableBalance,
      operations,
      operationsCount: operations.length,
    };
  };
}
