import { matchCorrespondingIcon, createRareSatObject } from "./helpers";
import { SimpleHashNft } from "@ledgerhq/live-nft/api/types";
import { regroupRareSatsByContractAddress } from "@ledgerhq/live-nft-react";

type Props = {
  rareSats: SimpleHashNft[];
};

export const useRareSatsModel = ({ rareSats }: Props) => {
  const matchedRareSats = matchCorrespondingIcon(rareSats);
  const regroupedRareSats = regroupRareSatsByContractAddress(matchedRareSats);
  const rareSatsCreated = createRareSatObject(regroupedRareSats);
  return { rareSats: rareSatsCreated };
};
