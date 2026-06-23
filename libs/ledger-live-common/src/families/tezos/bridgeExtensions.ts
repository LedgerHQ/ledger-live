import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { TEZOS_DUMMY_ADDRESS } from "@ledgerhq/coin-tezos/constants";
import { getVotesCount } from "./getVotesCount";

const extensions: AccountBridgeExtensions = {
  getEstimationRecipient: () => TEZOS_DUMMY_ADDRESS,
  getStakesCount: getVotesCount,
};

export default extensions;
