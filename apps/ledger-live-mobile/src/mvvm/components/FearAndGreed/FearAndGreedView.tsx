import React from "react";
import { useTranslation } from "~/context/Locale";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { Text, BottomSheetView, BottomSheetHeader } from "@ledgerhq/lumen-ui-rnative";
import FearAndGreedCard from "./components/FearAndGreedCard";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import QueuedDrawerGorhom, {
  BottomSheetView as GorhomBottomSheetView,
} from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
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
  const { isEnabled } = useWalletFeaturesConfig("mobile");

  if (!data || isError) return null;

  if (isEnabled) {
    return (
      <>
        <FearAndGreedCard data={data} onPress={handleOpenDrawer} />
        <QueuedDrawerBottomSheet
          isRequestingToBeOpened={isDrawerOpen}
          onClose={handleCloseDrawer}
          enableDynamicSizing
        >
          <BottomSheetView style={{ paddingBottom: bottomInset + 24 }}>
            <BottomSheetHeader />
            <FearAndGreedTitle />
            <Text typography="body1" lx={{ color: "base" }}>
              {t("fearAndGreed.description")}
            </Text>
          </BottomSheetView>
        </QueuedDrawerBottomSheet>
      </>
    );
  }

  return (
    <>
      <FearAndGreedCard data={data} onPress={handleOpenDrawer} />
      <QueuedDrawerGorhom
        isRequestingToBeOpened={isDrawerOpen}
        onClose={handleCloseDrawer}
        enableDynamicSizing
      >
        <GorhomBottomSheetView style={{ paddingBottom: bottomInset + 24, paddingTop: 32 }}>
          <FearAndGreedTitle />
          <Text typography="body1" lx={{ color: "base" }}>
            {t("fearAndGreed.description")}
          </Text>
        </GorhomBottomSheetView>
      </QueuedDrawerGorhom>
    </>
  );
};
