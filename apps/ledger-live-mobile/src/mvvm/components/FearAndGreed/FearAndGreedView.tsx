import React from "react";
import type { FearAndGreedViewProps } from "./types";
import FearAndGreedCard from "./components/FearAndGreedCard";
import FearAndGreedExpandedCard, {
  FearAndGreedExpandedCardSkeleton,
} from "./components/FearAndGreedExpandedCard";
import FearAndGreedDefinitionSheet from "./components/FearAndGreedDefinitionSheet";

export const FearAndGreedView = ({
  data,
  isLoading,
  isError,
  isDrawerOpen,
  handleOpenDrawer,
  handleCloseDrawer,
  appearance,
  width,
}: FearAndGreedViewProps) => {
  if (appearance === "expanded" && isLoading) {
    return <FearAndGreedExpandedCardSkeleton width={width} testID="fear-and-greed-card-skeleton" />;
  }

  if (!data || isError) return null;

  return (
    <>
      {appearance === "expanded" ? (
        <FearAndGreedExpandedCard data={data} width={width} onPress={handleOpenDrawer} />
      ) : (
        <FearAndGreedCard data={data} onPress={handleOpenDrawer} />
      )}
      <FearAndGreedDefinitionSheet isOpen={isDrawerOpen} onClose={handleCloseDrawer} />
    </>
  );
};
