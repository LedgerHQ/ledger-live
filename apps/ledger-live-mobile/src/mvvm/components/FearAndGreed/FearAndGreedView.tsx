import React from "react";
import { useTranslation } from "~/context/Locale";
import MarketInsightErrorCard from "LLM/components/MarketInsightErrorCard";
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
  const { t } = useTranslation();

  if (appearance === "expanded" && isLoading) {
    return <FearAndGreedExpandedCardSkeleton width={width} testID="fear-and-greed-card-skeleton" />;
  }

  if (!data || isError) {
    if (appearance === "expanded") {
      return (
        <MarketInsightErrorCard
          title={t("fearAndGreed.title")}
          message={t("marketBanner.connectionFailed")}
          width={width}
          testID="fear-and-greed-card-error"
        />
      );
    }

    return null;
  }

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
