import React from "react";
import { Slides } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { useWalletV4TourDrawerViewModel } from "./hooks/useWalletV4TourDrawerViewModel";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { default as QueuedDrawerBottomSheet } from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { Platform, StyleSheet } from "react-native";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { TrackScreen } from "~/analytics";
import { PAGE_TRACKING_WALLET_V4_TOUR, SLIDES_CONTAINER_HEIGHT, SLIDES_LIST_HEIGHT } from "./const";

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
  closeDrawer,
  onSlideChange,
  slides,
}: WalletV4TourDrawerProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();

  return (
    <QueuedDrawerBottomSheet
      isRequestingToBeOpened={isDrawerOpen}
      onClose={closeDrawer}
      enableDynamicSizing
      // iOS hugs content correctly with the fullWithOffset cap; on Android that cap forces the
      // sheet toward full height (large gap below the button), so we leave it uncapped to hug content.
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : undefined}
    >
      {/* Keep the sheet mounted and gate only the content: closing via `isDrawerOpen` lets the modal
          dismiss cleanly instead of being unmounted mid-present, which would leave a stale entry in
          the BottomSheetModalProvider and block every subsequent drawer. */}
      {isDrawerOpen ? (
        <BottomSheetView style={[styles.content, { paddingBottom: bottomInset + 8 }]}>
          <BottomSheetHeader />
          <TrackScreen page={PAGE_TRACKING_WALLET_V4_TOUR} source="Wallet" />
          <Slides
            bounces={false}
            as={AnimatedGestureHandlerFlatList}
            testID="walletv4-tour-slides-container"
            initialNumToRender={1}
            maxToRenderPerBatch={Platform.OS === "ios" ? 1 : undefined}
            onSlideChange={onSlideChange}
            style={styles.slidesContainer}
            contentContainerStyle={{ height: SLIDES_LIST_HEIGHT }}
          >
            <Slides.Content>
              {slides.map((slide, index) => (
                <Slides.Content.Item key={slide.title + slide.description}>
                  <SlideItem
                    title={slide.title}
                    description={slide.description}
                    index={index}
                    lottieSrc={slide.lottieSrc}
                    speed={slide.speed}
                  />
                </Slides.Content.Item>
              ))}
            </Slides.Content>

            <Slides.ProgressIndicator style={styles.progressIndicator}>
              <ProgressIndicator />
            </Slides.ProgressIndicator>

            <Slides.Footer>
              <SlideFooterButton onClose={handleCloseDrawer} />
            </Slides.Footer>
          </Slides>
        </BottomSheetView>
      ) : null}
    </QueuedDrawerBottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
  },
  slidesContainer: {
    height: SLIDES_CONTAINER_HEIGHT,
  },
  progressIndicator: {
    marginTop: 40,
    marginBottom: 32,
  },
});
