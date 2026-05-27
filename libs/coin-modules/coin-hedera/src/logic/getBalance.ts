import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { HederaAddAccountError } from "../errors";
import { resolveConfig } from "./utils";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccountV2 } from "../network/utils";

export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  try {
    const coinConfig = resolveConfig(currency.id);
    // Fetch only the specific staked node (or nothing at all for non-staking
    // accounts) instead of paginating the full /network/nodes list. The
    // validator lookup is chained on the account promise so it still runs
    // concurrently with the token fetches.
    const mirrorAccountPromise = apiClient.getAccount(address);
    const validatorPromise = mirrorAccountPromise.then(account =>
      typeof account.staked_node_id === "number" && account.staked_node_id >= 0
        ? apiClient.getNode(account.staked_node_id)
        : null,
    );
    const [mirrorAccount, mirrorTokens, erc20TokenBalances, validator] = await Promise.all([
      mirrorAccountPromise,
      apiClient.getAccountTokens(address),
      coinConfig.useHgraphForErc20 ? getERC20BalancesForAccountV2(address) : Promise.resolve([]),
      validatorPromise,
    ]);

    const mixedTokens = [...mirrorTokens, ...erc20TokenBalances];

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
          actions: [],
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
  } catch (err) {
    const isNonExistentAccount =
      err instanceof HederaAddAccountError || (err instanceof LedgerAPI4xx && err.status === 404);

    if (isNonExistentAccount) {
      return [];
    }

    throw err;
  }
}
