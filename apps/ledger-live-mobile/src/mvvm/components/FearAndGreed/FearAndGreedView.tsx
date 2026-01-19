import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "react-i18next";
import { BottomSheetView } from "@gorhom/bottom-sheet";
import FearAndGreedCard from "./components/FearAndGreedCard";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import FearAndGreedTitle from "./components/FearAndGreedTitle";
import type { FearAndGreedViewProps } from "./types";

export const FearAndGreedView = ({
  data,
  isError,
  isDrawerOpen,
  handleOpenDrawer,
  handleCloseDrawer,
}: FearAndGreedViewProps) => {
  const { t } = useTranslation();

  if (!data || isError) return null;

  return (
    <>
      <FearAndGreedCard data={data} onPress={handleOpenDrawer} />
      <QueuedDrawerGorhom
        isRequestingToBeOpened={isDrawerOpen}
        onClose={handleCloseDrawer}
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: 24, paddingTop: 32 }}>
          <FearAndGreedTitle />
          <Text typography="body1" lx={{ color: "base" }}>
            {t("fearAndGreed.description")}
          </Text>
        </BottomSheetView>
      </QueuedDrawerGorhom>
    </>
  );
};
