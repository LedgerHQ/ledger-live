import { abortable } from "@ledgerhq/coin-module-framework/promises";
import { splitAccountKey } from "../accountKey";
import { apiClient } from "../network/api";
import type { AleoContext } from "../types";
import { getPublicBalance } from "./getPublicBalance";

/** Read on the public state only: an account holding nothing but private records reads as unused. */
export async function getAccountStatus(
  context: AleoContext,
  key: string,
): Promise<{ used: boolean }> {
  const { address } = splitAccountKey(key);
  const config = await context.config();
  const [balances, { transactions }] = await abortable(context.signal, () =>
    Promise.all([
      getPublicBalance(config, address),
      apiClient.getAccountPublicTransactions({ config, address, limit: 1 }),
    ]),
  );
  return { used: transactions.length > 0 || balances.some(({ value }) => value > 0n) };
}
