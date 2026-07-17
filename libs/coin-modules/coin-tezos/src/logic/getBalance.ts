import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import api from "../network/tzkt";
import { hasManagerKey } from "../network/types";
import { buildStakesForAccount, fetchUnstakeRequests } from "./getStakes";
import { partitionNativeBalance } from "../utils";

/** Returns `[native, ...stakes, ...tokens]` per the Paris upgrade. */
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
        assetReference: `${token.contract.address}:${token.tokenId ?? "0"}`,
        assetOwner: address,
        name: token.contract.alias,
        ...(unit && { unit }),
      },
    };
  });

  // We don't compute native/stake balances for non-manager account types (empty / contract /
  // ghost / rollup). KT1 contracts can hold XTZ, but they aren't user-facing wallet accounts
  // here, so we report a 0 native balance alongside any token balances.
  if (!hasManagerKey(apiAccount)) {
    return [{ value: 0n, asset: { type: "native" } }, ...tokensBalance];
  }

  const normalized = BigInt(apiAccount.balance);

  const unstakeRequests = await fetchUnstakeRequests(address, apiAccount).catch(error => {
    log("coin:tezos", "getBalance: fetchUnstakeRequests failed; degrading stakes to []", {
      error,
      address,
    });
    return [];
  });

  const stakes = buildStakesForAccount(address, apiAccount, unstakeRequests);
  const stakedBalance = BigInt(apiAccount.stakedBalance ?? 0);
  const unstakedBalance = BigInt(apiAccount.unstakedBalance ?? 0);
  const { locked } = partitionNativeBalance(normalized, stakedBalance, unstakedBalance);

  const stakeBalances: Balance[] = stakes.map(stake => ({
    value: stake.amount,
    asset: { type: "native" },
    stake,
  }));

  return [
    {
      value: normalized,
      asset: { type: "native" },
      ...(locked > 0n && { locked }),
    },
    ...stakeBalances,
    ...tokensBalance,
  ];
}
