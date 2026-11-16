import { AccountDataNotServedError } from "@domain/api-account-data";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import type { CoinModuleBalanceApi } from "../host";

function row(assetId: string, value: bigint, locked = 0n): AccountAssetBalance {
  const balance = value > 0n ? value : 0n;
  const lockedInBalance = locked < balance ? locked : balance;
  return AccountAssetBalanceSchema.parse({
    assetId,
    balance: balance.toString(),
    spendableBalance: (balance - lockedInBalance).toString(),
    // The framework does not tell why: a minimum balance, a rent or a deposit.
    ...(lockedInBalance > 0n
      ? { locked: [{ reason: "reserve", amount: lockedInBalance.toString() }] }
      : {}),
  });
}

const isNative = ({ asset }: Balance) => asset.type === "native";

function nativeBalance(natives: Balance[], partitioned: boolean) {
  const entries = partitioned ? natives : natives.slice(0, 1);
  return {
    value: entries.reduce((sum, { value }) => sum + value, 0n),
    locked: entries.reduce((sum, { locked = 0n }) => sum + locked, 0n),
  };
}

/** The `balance` kind of an address: its native coin first, then each token the host lists and does not blacklist. */
export async function toAccountBalances(
  currencyId: string,
  balances: Balance[],
  { getTokenId, partitionsNativeBalance = false }: CoinModuleBalanceApi,
  blacklistedTokenIds: ReadonlySet<string>,
): Promise<AccountAssetBalance[]> {
  if (!getTokenId && !balances.every(isNative)) {
    throw new AccountDataNotServedError(`No token resolver for the ${currencyId} coin module`);
  }
  const native = nativeBalance(balances.filter(isNative), partitionsNativeBalance);
  const tokens = await Promise.all(
    balances
      .filter(balance => !isNative(balance))
      .map(async ({ asset, value, locked }) => ({ id: await getTokenId?.(asset), value, locked })),
  );
  return [
    row(currencyId, native.value, native.locked),
    ...tokens.flatMap(({ id, value, locked }) =>
      id === undefined || blacklistedTokenIds.has(id) ? [] : [row(id, value, locked)],
    ),
  ];
}
