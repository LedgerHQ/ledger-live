import React from "react";
import { Slides } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
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

type WalletV4TourDrawerProps = Omit<
  ReturnType<typeof useWalletV4TourDrawerViewModel>,
  "handleOpenDrawer"
>;

export const WalletV4TourDrawer = ({
  isDrawerOpen,
  handleCloseDrawer,
  slides,
}: WalletV4TourDrawerProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isDrawerOpen}
      onClose={handleCloseDrawer}
      snapPoints={["92%"]}
      noCloseButton={false}
      animateOnMount={false}
    >
      <Slides
        bounces={false}
        as={AnimatedGestureHandlerFlatList}
        testID="walletv4-tour-slides-container"
        scrollEnabled={false}
        initialNumToRender={1}
        updateCellsBatchingPeriod={2}
      >
        <Slides.Content>
          {slides.map((slide, index) => (
            <Slides.Content.Item key={slide.title + slide.description}>
              <SlideItem
                title={slide.title}
                description={slide.description}
                index={index}
                lottieSrc={slide.lottieSrc}
              />
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
