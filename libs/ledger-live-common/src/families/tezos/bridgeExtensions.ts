import type { AccountBridgeExtensions } from "@ledgerhq/types-live";
import { getVotesCount } from "./getVotesCount";

const extensions: AccountBridgeExtensions = {
  getStakesCount: getVotesCount,
};

export default extensions;
