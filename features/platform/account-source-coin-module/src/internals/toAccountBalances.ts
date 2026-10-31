import { AccountDataNotServedError } from "@domain/api-account-data";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import type { CoinModuleBalance, CoinModuleBalanceApi } from "../host";

const row = (assetId: string, value: bigint, locked = 0n): AccountAssetBalance =>
  AccountAssetBalanceSchema.parse({
    assetId,
    balance: (value > 0n ? value : 0n).toString(),
    spendableBalance: (value > locked ? value - locked : 0n).toString(),
  });

const isNative = ({ asset }: CoinModuleBalance) => asset.type === "native";

function nativeBalance(natives: CoinModuleBalance[], partitioned: boolean) {
  const entries = partitioned ? natives : natives.slice(0, 1);
  return {
    value: entries.reduce((sum, { value }) => sum + value, 0n),
    locked: entries.reduce((sum, { locked = 0n }) => sum + locked, 0n),
  };
}

/** The `balance` kind of an address: its native coin first, then each token the host lists and does not blacklist. */
export async function toAccountBalances(
  currencyId: string,
  balances: CoinModuleBalance[],
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
