import type { Balance } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { HederaAddAccountError } from "../errors";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccount } from "../network/utils";

export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  try {
    const [mirrorAccount, mirrorTokens, mirrorNodes, erc20TokenBalances] = await Promise.all([
      apiClient.getAccount(address),
      apiClient.getAccountTokens(address),
      apiClient.getNodes({ fetchAllPages: true }),
      getERC20BalancesForAccount(address),
    ]);

    const mixedTokens = [...mirrorTokens, ...erc20TokenBalances];
    const stakedNodeId = mirrorAccount.staked_node_id;
    const delegatedNode = mirrorNodes.nodes.find(node => node.node_id === stakedNodeId);
    const balance = BigInt(mirrorAccount.balance.balance);
    const pendingReward = BigInt(mirrorAccount.pending_reward);

    const balances: Balance[] = [
      {
        asset: { type: "native" },
        value: BigInt(mirrorAccount.balance.balance),
        ...(delegatedNode && {
          stake: {
            uid: address,
            address,
            asset: { type: "native" },
            state: delegatedNode ? "active" : "inactive",
            amount: balance + pendingReward,
            amountDeposited: balance,
            amountRewarded: pendingReward,
            details: {
              stakedNodeId,
              overstaked: delegatedNode
                ? BigInt(delegatedNode.stake) >= BigInt(delegatedNode.max_stake)
                : null,
            },
            ...(delegatedNode && {
              delegate: delegatedNode.node_account_id,
            }),
          },
        }),
      },
    ];

    for (const item of mixedTokens) {
      const tokenAddress = "token_id" in item ? item.token_id : item.token.contractAddress;
      const calToken = await getCryptoAssetsStore().findTokenByAddressInCurrency(
        tokenAddress,
        currency.id,
      );

      if (!calToken) {
        continue;
      }

      balances.push({
        value: BigInt(item.balance.toString()),
        asset: {
          type: calToken.tokenType,
          assetReference: calToken.contractAddress,
          assetOwner: address,
          name: calToken.name,
          unit: calToken.units[0],
        },
      });
    }

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
