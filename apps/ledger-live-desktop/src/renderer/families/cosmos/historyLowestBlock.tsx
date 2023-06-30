import { CosmosAccount } from "@ledgerhq/live-common/families/cosmos/types";

export const historyLowestBlock = ({ account }: { account: CosmosAccount }) => {
  const { cosmosResources } = account;
  const { lowestBlockHeight } = cosmosResources;
  return lowestBlockHeight;
};
