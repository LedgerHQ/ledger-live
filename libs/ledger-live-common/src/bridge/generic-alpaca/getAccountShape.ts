import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import { GetAccountShape, mergeOps } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import BigNumber from "bignumber.js";
import { getAlpacaApi } from "./alpaca";
import { adaptCoreOperationToLiveOperation } from "./utils";
import { Account } from "@ledgerhq/types-live";

export function genericGetAccountShape(network: string, kind: "local" | "remote"): GetAccountShape {
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

      const balances = await getAlpacaApi(network, kind).getBalance(address);

      const nativeBalance = balances.find(b => b.asset.type === "native");

      const staked: Account["staked"] = balances
        .filter(b => b.staking !== undefined)
        .map(b => {
          return {
            amount: BigNumber(b.value.toString()),
            validator: b.staking?.validator,
            rewards: b.staking?.rewards,
          };
        });

      const balance = BigNumber(nativeBalance ? nativeBalance.value.toString() : "0");

      let spendableBalance: BigNumber;

      if (nativeBalance?.locked) {
        spendableBalance = BigNumber.max(
          balance.minus(BigNumber(nativeBalance.locked.toString())),
          BigNumber(0),
        );
      } else {
        spendableBalance = initialAccount?.spendableBalance || balance;
      }
      const oldOperations = initialAccount?.operations || [];

      const blockHeight = oldOperations.length ? (oldOperations[0].blockHeight ?? 0) + 1 : 0;

      const [newOperations] = await getAlpacaApi(network, kind).listOperations(address, {
        minHeight: blockHeight,
      });

      const operations = mergeOps(
        oldOperations,
        newOperations.map(op => adaptCoreOperationToLiveOperation(accountId, op)),
      );

      return {
        id: accountId,
        xpub: address,
        blockHeight: blockInfo.height || initialAccount?.blockHeight,
        balance,
        spendableBalance,
        operations,
        operationsCount: operations.length,
        staking: staked,
      };
    } catch (e) {
      console.error("Error in getAccountShape", e);
      throw e;
    }
  };
}
