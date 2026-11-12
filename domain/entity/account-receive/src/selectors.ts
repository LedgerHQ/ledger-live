import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { AccountReceive, AccountReceivesState } from "./schema";

export type WithAccountReceives = { accountReceives: AccountReceivesState };

export const selectAccountReceive = (
  state: WithAccountReceives,
  accountUUID: AccountUUID,
): AccountReceive | undefined => state.accountReceives[accountUUID]?.receive;
