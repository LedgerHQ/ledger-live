import { isAccountEmpty as tronIsAccountEmpty } from "@ledgerhq/coin-tron/index";
import { TRON_DUMMY_ADDRESS } from "@ledgerhq/coin-tron/constants";
import type { Account, AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { defaultIsAccountEmpty } from "../../bridge/defaultBridgeExtensions";
import { getVotesCount } from "./getVotesCount";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => TRON_DUMMY_ADDRESS,
  isAccountEmpty: (account: AccountLike) =>
    account.type === "Account"
      ? tronIsAccountEmpty(account as unknown as Parameters<typeof tronIsAccountEmpty>[0])
      : defaultIsAccountEmpty(account),
  getStakesCount: getVotesCount as unknown as (account: Account) => number,
};

export default extensions;
