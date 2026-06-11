import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import api from "../network/tzkt";
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
  const normalized = apiAccount.type === "user" ? BigInt(apiAccount.balance) : 0n;

  const unstakeRequests = await fetchUnstakeRequests(address, apiAccount).catch(error => {
    log("coin:tezos", "getBalance: fetchUnstakeRequests failed; degrading stakes to []", {
      error,
      address,
    });
    return [];
  });

  const stakes =
    apiAccount.type === "user" ? buildStakesForAccount(address, apiAccount, unstakeRequests) : [];

  const stakedBalance = apiAccount.type === "user" ? BigInt(apiAccount.stakedBalance ?? 0) : 0n;
  const unstakedBalance = apiAccount.type === "user" ? BigInt(apiAccount.unstakedBalance ?? 0) : 0n;
  const { locked } = partitionNativeBalance(normalized, stakedBalance, unstakedBalance);

  const stakeBalances: Balance[] = stakes.map(stake => ({
    value: stake.amount,
    asset: { type: "native" },
    stake,
  }));

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
