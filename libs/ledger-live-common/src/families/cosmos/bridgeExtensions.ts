import { isAccountEmpty as cosmosIsAccountEmpty } from "@ledgerhq/coin-cosmos/helpers";
import type { Account, AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { defaultIsAccountEmpty } from "../../bridge/defaultBridgeExtensions";
import { getVotesCount } from "./getVotesCount";

const extensions: AccountBridgeExtensions = {
  isAccountEmpty: (account: AccountLike) =>
    account.type === "Account"
      ? cosmosIsAccountEmpty(account as unknown as Parameters<typeof cosmosIsAccountEmpty>[0])
      : defaultIsAccountEmpty(account),
  getStakesCount: getVotesCount as unknown as (account: Account) => number,
};

export default extensions;
