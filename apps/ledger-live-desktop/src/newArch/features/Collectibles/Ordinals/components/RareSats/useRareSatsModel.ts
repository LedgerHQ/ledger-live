import { mockedRareSats } from "LLD/features/Collectibles/__integration__/mockedRareSats";
import { processRareSats, groupRareSats, finalizeRareSats } from "./helpers";

type RareSatsProps = {};

export const useRareSatsModel = (_props: RareSatsProps) => {
  const processedRareSats = processRareSats(mockedRareSats);
  const groupedRareSats = groupRareSats(processedRareSats);
  const finalRareSats = finalizeRareSats(groupedRareSats);

  return { rareSats: finalRareSats };
};
