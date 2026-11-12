import { isAccountEmpty as cosmosIsAccountEmpty } from "@ledgerhq/coin-cosmos/helpers";
import { getCosmosDummyRecipient } from "@ledgerhq/coin-cosmos/logic";
import type { Account, AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { defaultIsAccountEmpty } from "../../bridge/defaultBridgeExtensions";
import { getVotesCount } from "./getVotesCount";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: account => getCosmosDummyRecipient(account.currency.id),
  isAccountEmpty: (account: AccountLike) =>
    account.type === "Account"
      ? cosmosIsAccountEmpty(account as unknown as Parameters<typeof cosmosIsAccountEmpty>[0])
      : defaultIsAccountEmpty(account),
  getStakesCount: getVotesCount as unknown as (account: Account) => number,
};

export default extensions;
