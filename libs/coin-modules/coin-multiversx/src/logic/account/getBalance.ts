import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import type { MultiversXNetworkApi } from "../../network/api";

/**
 * Returns all asset balances for a MultiversX address:
 * - native EGLD (including staked/delegated amounts)
 * - one entry per ESDT token (including zero-balance tokens)
 *
 * ESDT identifiers are case-preserved as returned by the API.
 */
export async function getBalance(api: MultiversXNetworkApi, address: string): Promise<Balance[]> {
  const [accountDetails, delegations, esdtTokens] = await Promise.all([
    api.getAccountDetails(address),
    api.getAccountDelegations(address),
    api.getESDTTokensForAddress(address),
  ]);

  // Compute staked balance from delegations (active stake + claimable rewards + unbonding)
  let delegationBalance = BigInt(0);
  for (const delegation of delegations) {
    let delegationTotal = new BigNumber(delegation.userActiveStake).plus(
      new BigNumber(delegation.claimableRewards),
    );
    for (const undelegation of delegation.userUndelegatedList) {
      delegationTotal = delegationTotal.plus(new BigNumber(undelegation.amount));
    }
    delegationBalance += BigInt(delegationTotal.toFixed(0));
  }

  const spendable = BigInt(new BigNumber(accountDetails.balance).toFixed(0));
  const totalNative = spendable + delegationBalance;

  const nativeBalance: Balance = {
    value: totalNative,
    asset: { type: "native" },
    ...(delegationBalance > 0n ? { locked: delegationBalance } : {}),
  };

  const esdtBalances: Balance[] = esdtTokens.map(token => ({
    value: BigInt(new BigNumber(token.balance ?? "0").toFixed(0)),
    asset: {
      type: "esdt",
      assetReference: token.identifier, // case preserved
    },
  }));

  return [nativeBalance, ...esdtBalances];
}
