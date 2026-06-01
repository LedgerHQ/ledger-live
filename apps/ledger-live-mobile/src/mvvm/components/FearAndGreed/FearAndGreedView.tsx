import React from "react";
import FearAndGreedCard from "./components/FearAndGreedCard";
import FearAndGreedExpandedCard from "./components/FearAndGreedExpandedCard";
import FearAndGreedDefinitionBottomSheet from "./components/FearAndGreedDefinitionBottomSheet";
import type { FearAndGreedViewProps } from "./types";

export const FearAndGreedView = ({
  data,
  isError,
  isDrawerOpen,
  handleOpenDrawer,
  handleCloseDrawer,
  appearance = "compact",
}: FearAndGreedViewProps) => {
  if (!data || isError) return null;

  return (
    <>
      {appearance === "expanded" ? (
        <FearAndGreedExpandedCard data={data} onPress={handleOpenDrawer} />
      ) : (
        <FearAndGreedCard data={data} onPress={handleOpenDrawer} />
      )}
      <FearAndGreedDefinitionBottomSheet isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </>
  );
};
