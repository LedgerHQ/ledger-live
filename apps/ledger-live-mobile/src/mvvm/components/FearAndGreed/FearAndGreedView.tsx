import React from "react";
import { Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "~/context/Locale";
import { BottomSheetView } from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import FearAndGreedCard from "./components/FearAndGreedCard";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import FearAndGreedTitle from "./components/FearAndGreedTitle";
import type { FearAndGreedViewProps } from "./types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const FearAndGreedView = ({
  data,
  isError,
  isDrawerOpen,
  handleOpenDrawer,
  handleCloseDrawer,
}: FearAndGreedViewProps) => {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();

  if (!data || isError) return null;

  return (
    <>
      <FearAndGreedCard data={data} onPress={handleOpenDrawer} />
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isDrawerOpen}
        onClose={handleCloseDrawer}
        enableDynamicSizing
      >
        <BottomSheetView style={{ paddingBottom: bottomInset + 24, paddingTop: 32 }}>
          <FearAndGreedTitle />
          <Text typography="body1" lx={{ color: "base" }}>
            {t("fearAndGreed.description")}
          </Text>
        </BottomSheetView>
      </QueuedDrawerBottomSheet>
    </>
  );
};
