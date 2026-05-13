import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import api from "../network/tzkt";
import { buildStakesForAccount } from "./getStakes";

/**
 * Returns the balances of the given address as an array of Balance objects.
 * The first entry represents the native balance (with value 0n for empty accounts).
 * For delegated/staked accounts, additional native entries are appended carrying each
 * staking position (delegation, active staking, deactivating unstake) per the Paris upgrade.
 * Token balances are appended after.
 */
export async function getBalance(address: string): Promise<Balance[]> {
  const [apiAccountResult, tokensBalancesResult] = await Promise.allSettled([
    api.getAccountByAddress(address),
    api.getTokensBalances(address),
  ]);

  if (apiAccountResult.status !== "fulfilled") {
    throw apiAccountResult.reason;
  }

  const apiAccount = apiAccountResult.value;
  const tokensBalancesRaw =
    tokensBalancesResult.status === "fulfilled" ? tokensBalancesResult.value : [];
  const normalized = apiAccount.type === "user" ? BigInt(apiAccount.balance) : 0n;

  const stakeBalances: Balance[] =
    apiAccount.type === "user"
      ? buildStakesForAccount(address, apiAccount).map(stake => ({
          value: stake.amount,
          asset: { type: "native" },
          stake,
        }))
      : [];

  const tokensBalance: Balance[] = tokensBalancesRaw.map(({ balance, token }) => {
    const magnitude = Number.parseInt(token.metadata?.decimals || "0", 10);
    const name = token.metadata?.name ?? token.contract.alias ?? "";
    const symbol = token.metadata?.symbol ?? token.contract.alias ?? "";
    const unit =
      Number.isFinite(magnitude) && name && symbol
        ? {
            magnitude,
            name,
            code: symbol,
          }
        : undefined;
    return {
      value: BigInt(balance),
      asset: {
        type: token.standard,
        assetReference: token.contract.address,
        assetOwner: address,
        name: token.contract.alias,
        ...(unit && { unit }),
      },
    };
  });

  return [
    {
      value: normalized,
      asset: { type: "native" },
    },
    ...stakeBalances,
    ...tokensBalance,
  ];
}
