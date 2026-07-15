import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import BigNumber from "bignumber.js";
import { type HederaCoinConfig } from "../config";
import { HederaAddAccountError } from "../errors";
import { apiClient } from "../network/api";
import { getERC20BalancesForAccountV2 } from "../network/utils";
import type { HederaERC20TokenBalance, HederaMirrorToken } from "../types";
import { resolveConfig } from "./utils";

function mapMirrorTokenToBalance(token: HederaMirrorToken, address: string): Balance {
  return {
    value: BigInt(new BigNumber(token.balance).toFixed(0)),
    asset: {
      type: "hts",
      assetReference: token.token_id,
      assetOwner: address,
    },
  };
}

function mapErc20TokenToBalance(token: HederaERC20TokenBalance, address: string): Balance {
  return {
    value: BigInt(token.balance.toFixed(0)),
    asset: {
      type: "erc20",
      assetReference: token.contractAddress,
      assetOwner: address,
    },
  };
}

export async function getBalance({
  config,
  currencyId,
  address,
}: {
  config?: HederaCoinConfig;
  currencyId: string;
  address: string;
}): Promise<Balance[]> {
  const coinConfig = resolveConfig(config ?? currencyId);

  try {
    // Fetch only the specific staked node (or nothing at all for non-staking
    // accounts) instead of paginating the full /network/nodes list. The
    // validator lookup is chained on the account promise so it still runs
    // concurrently with the token fetches.
    const mirrorAccountPromise = apiClient.getAccount({ configOrCurrencyId: coinConfig, address });
    const validatorPromise = mirrorAccountPromise.then(account =>
      typeof account.staked_node_id === "number" && account.staked_node_id >= 0
        ? apiClient.getNode({ configOrCurrencyId: coinConfig, nodeId: account.staked_node_id })
        : null,
    );
    const [mirrorAccount, mirrorTokens, erc20TokenBalances, validator] = await Promise.all([
      mirrorAccountPromise,
      apiClient.getAccountTokens({ configOrCurrencyId: coinConfig, address }),
      getERC20BalancesForAccountV2({ configOrCurrencyId: coinConfig, address }),
      validatorPromise,
    ]);

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

    const tokenBalances: Balance[] = [
      ...mirrorTokens.map(token => mapMirrorTokenToBalance(token, address)),
      ...erc20TokenBalances.map(token => mapErc20TokenToBalance(token, address)),
    ];

    return [nativeBalance, ...tokenBalances];
  } catch (err) {
    const isNonExistentAccount =
      err instanceof HederaAddAccountError || (err instanceof LedgerAPI4xx && err.status === 404);

    if (isNonExistentAccount) {
      return [];
    }

    throw err;
  }
}
