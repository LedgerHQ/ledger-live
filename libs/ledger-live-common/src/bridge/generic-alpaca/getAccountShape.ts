import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation } from "./utils";

export function genericGetAccountShape(network, kind): GetAccountShape {
  return async info => {
    try {
      const { address, initialAccount, currency, derivationMode } = info;
      const accountId = encodeAccountId({
        type: "js",
        version: "2",
        currencyId: currency.id,
        xpubOrAddress: address,
        derivationMode,
      });

      const blockInfo = await getAlpacaApi(network, kind).lastBlock();

      const balanceRes = await getAlpacaApi(network, kind).getBalance(address);
      // FIXME: fix type Balance -> check "native" balance
      // is balance[0] always the native ?
      const balance = BigNumber(balanceRes[0].value.toString());

      let spendableBalance: BigNumber;
      if (balanceRes[0]?.locked) {
        spendableBalance = BigNumber.max(
          balance.minus(BigNumber(balanceRes[0].locked.toString())),
          BigNumber(0),
        );
      } else {
        spendableBalance = initialAccount?.spendableBalance || balance;
      }
      const oldOperations = initialAccount?.operations || [];

      const blockHeight = oldOperations.length ? (oldOperations[0].blockHeight ?? 0) + 1 : 0;

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
        blockHeight: initialAccount?.blockHeight || blockInfo.height,
        balance,
        spendableBalance,
        operations,
        operationsCount: operations.length,
      };
    } catch (e) {
      console.error("Error in getAccountShape", e);
      throw e;
    }
  };
}
