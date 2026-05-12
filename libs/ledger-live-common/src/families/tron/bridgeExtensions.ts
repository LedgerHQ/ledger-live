import { isAccountEmpty as tronIsAccountEmpty } from "@ledgerhq/coin-tron/index";
import type { Account, AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { defaultIsAccountEmpty } from "../../bridge/defaultBridgeExtensions";
import { getVotesCount } from "./getVotesCount";

const extensions: AccountBridgeExtensions = {
  isAccountEmpty: (account: AccountLike) =>
    account.type === "Account"
      ? tronIsAccountEmpty(account as unknown as Parameters<typeof tronIsAccountEmpty>[0])
      : defaultIsAccountEmpty(account),
  getStakesCount: getVotesCount as unknown as (account: Account) => number,
};

export default extensions;
