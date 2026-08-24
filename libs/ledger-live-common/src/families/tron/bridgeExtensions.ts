import { TRON_DUMMY_ADDRESS } from "@ledgerhq/coin-tron/constants";
import { isAccountEmpty as tronIsAccountEmpty } from "@ledgerhq/coin-tron/index";
import type { AccountBridgeExtensions, AccountLike } from "@ledgerhq/types-live";
import { defaultIsAccountEmpty } from "../../bridge/defaultBridgeExtensions";
import { getVotesCount } from "./getVotesCount";

const extensions: AccountBridgeExtensions = {
  isAccountEmpty: (account: AccountLike) =>
    account.type === "Account"
      ? tronIsAccountEmpty(account as unknown as Parameters<typeof tronIsAccountEmpty>[0])
      : defaultIsAccountEmpty(account),
  // Swap quotes a network fee before the user has picked a recipient, and
  // `bridge/defaultBridgeExtensions.ts` throws for a family that declares no placeholder — which
  // would break every TRX/TRC10/TRC20 swap quote.
  getEstimationRecipient: () => TRON_DUMMY_ADDRESS,
  getStakesCount: getVotesCount,
};

export default extensions;
