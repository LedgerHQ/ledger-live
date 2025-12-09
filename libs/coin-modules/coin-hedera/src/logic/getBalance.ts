import invariant from "invariant";
import type { Balance } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccount } from "../network/utils";
import { toEVMAddress } from "./utils";

export async function getBalance(currency: CryptoCurrency, address: string): Promise<Balance[]> {
  const evmAddress = await toEVMAddress(address);
  invariant(evmAddress, "hedera: evm address is missing");

  const [mirrorAccount, mirrorTokens, mirrorNodes, erc20TokenBalances] = await Promise.all([
    apiClient.getAccount(address),
    apiClient.getAccountTokens(address),
    apiClient.getNodes({ fetchAllPages: true }),
    getERC20BalancesForAccount(evmAddress),
  ]);

  const mixedTokens = [...mirrorTokens, ...erc20TokenBalances];
  const validator = mirrorNodes.nodes.find(v => v.node_id === mirrorAccount.staked_node_id);

  const balances: Balance[] = [
    {
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
}
