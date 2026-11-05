import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { CryptoOrTokenCurrencyId } from "@domain/entity-currency";
import type { AccountReceive, AccountReceivesState } from "./schema";

export type WithAccountReceives = { accountReceives: AccountReceivesState };

export const selectAccountReceive = (
  state: WithAccountReceives,
  accountUUID: AccountUUID,
  assetId: CryptoOrTokenCurrencyId,
): AccountReceive | undefined => state.accountReceives[accountUUID]?.[assetId]?.receive;
