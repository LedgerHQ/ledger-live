import type { Balance } from "@ledgerhq/coin-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import hederaCoinConfig from "../config";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccountV2 } from "../network/utils";

export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  const coinConfig = hederaCoinConfig.getCoinConfig(currency);
  const [mirrorAccount, mirrorTokens, mirrorNodes, erc20TokenBalances] = await Promise.all([
    apiClient.getAccount(address),
    apiClient.getAccountTokens(address),
    apiClient.getNodes({ fetchAllPages: true }),
    coinConfig.useHgraphForErc20 ? getERC20BalancesForAccountV2(address) : Promise.resolve([]),
  ]);

  const mixedTokens = [...mirrorTokens, ...erc20TokenBalances];
  const validator = mirrorNodes.nodes.find(v => v.node_id === mirrorAccount.staked_node_id);

  const nativeBalance: Balance = {
    asset: { type: "native" },
    value: BigInt(mirrorAccount.balance.balance),
    ...(validator && {
      stake: {
        uid: address,
        address,
        asset: { type: "native" },
        state: "active",
        amount: BigInt(mirrorAccount.balance.balance) + BigInt(mirrorAccount.pending_reward),
        amountDeposited: BigInt(mirrorAccount.balance.balance),
        amountRewarded: BigInt(mirrorAccount.pending_reward),
        delegate: validator.node_account_id,
        details: {
          overstaked: BigInt(validator.stake) >= BigInt(validator.max_stake),
        },
      },
    }),
  };

  const tokenBalances = await promiseAllBatched(
    3,
    mixedTokens,
    async (item): Promise<Balance | null> => {
      const tokenAddress = "token_id" in item ? item.token_id : item.token.contractAddress;
      const calToken = await getCryptoAssetsStore().findTokenByAddressInCurrency(
        tokenAddress,
        currency.id,
      );

      if (!calToken || !calToken.units.length) {
        return null;
      }

      const roundedValue = new BigNumber(item.balance).toFixed(0);

      return {
        value: BigInt(roundedValue),
        asset: {
          type: calToken.tokenType,
          assetReference: calToken.contractAddress,
          assetOwner: address,
          name: calToken.name,
          unit: calToken.units[0],
        },
      };
    },
  );

  const balances: Balance[] = [nativeBalance, ...tokenBalances].filter(
    (balance): balance is Balance => balance !== null,
  );

  return balances;
}
