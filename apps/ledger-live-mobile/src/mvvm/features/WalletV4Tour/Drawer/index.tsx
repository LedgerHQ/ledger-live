import React, { useMemo } from "react";
import { Slides } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { useTranslation } from "~/context/Locale";
import { useWalletV4TourDrawerViewModel } from "./hooks/useWalletV4TourDrawerViewModel";
import QueuedDrawerGorhom from "LLM/components/QueuedDrawer/temp/QueuedDrawerGorhom";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { StyleSheet } from "react-native";
import { ProgressIndicator } from "./components/ProgressIndicator";

export const useWalletV4TourDrawer = () => {
  return useWalletV4TourDrawerViewModel();
};

const AnimatedGestureHandlerFlatList = Animated.createAnimatedComponent(FlatList);

interface WalletV4TourDrawerProps {
  readonly isDrawerOpen: boolean;
  readonly handleCloseDrawer: () => void;
}

export const WalletV4TourDrawer = ({
  isDrawerOpen,
  handleCloseDrawer,
}: WalletV4TourDrawerProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();

  const { t } = useTranslation();
  const SLIDES = useMemo(
    () => [
      {
        title: t("walletV4Tour.slides.portfolio.title"),
        description: t("walletV4Tour.slides.portfolio.description"),
      },
      {
        title: t("walletV4Tour.slides.navigation.title"),
        description: t("walletV4Tour.slides.navigation.description"),
      },
      {
        title: t("walletV4Tour.slides.actions.title"),
        description: t("walletV4Tour.slides.actions.description"),
      },
    ],
    [t],
  );

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isDrawerOpen}
      onClose={handleCloseDrawer}
      snapPoints={["92%"]}
      noCloseButton={false}
    >
      <Slides as={AnimatedGestureHandlerFlatList} testID="walletv4-tour-slides-container">
        <Slides.Content>
          {SLIDES.map((slide, index) => (
            <Slides.Content.Item key={slide.title + slide.description}>
              <SlideItem title={slide.title} description={slide.description} index={index} />
            </Slides.Content.Item>
          ))}
        </Slides.Content>

        <Slides.ProgressIndicator style={styles.progressIndicator}>
          <ProgressIndicator />
        </Slides.ProgressIndicator>

        <Slides.Footer style={{ marginBottom: bottomInset + 60 }}>
          <SlideFooterButton onClose={handleCloseDrawer} />
        </Slides.Footer>
      </Slides>
    </QueuedDrawerGorhom>
  );
};

const styles = StyleSheet.create({
  progressIndicator: {
    marginTop: 40,
    marginBottom: 32,
  },
});
