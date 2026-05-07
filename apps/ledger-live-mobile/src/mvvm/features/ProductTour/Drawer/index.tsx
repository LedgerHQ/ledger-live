import React from "react";
import { Slides } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { Platform, StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { TrackScreen } from "~/analytics";
import { useProductTourDrawerViewModel } from "./hooks/useProductTourDrawerViewModel";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_TOTAL_SLIDES } from "./const";

export const useProductTourDrawer = () => useProductTourDrawerViewModel();

const AnimatedGestureHandlerFlatList = Animated.createAnimatedComponent(FlatList);

type ProductTourDrawerProps = Omit<
  ReturnType<typeof useProductTourDrawerViewModel>,
  "openDrawer" | "productTourCompleted" | "handleCloseDrawer"
>;

export const ProductTourDrawer = ({
  isDrawerOpen,
  closeDrawer,
  onSlideChange,
}: ProductTourDrawerProps) => {
  if (!isDrawerOpen) {
    return null;
  }

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={isDrawerOpen} onClose={closeDrawer}>
      <BottomSheetView>
        <BottomSheetHeader />
        <TrackScreen page={PAGE_TRACKING_PRODUCT_TOUR} />
        <Slides
          bounces={false}
          as={AnimatedGestureHandlerFlatList}
          testID="product-tour-slides-container"
          initialNumToRender={1}
          maxToRenderPerBatch={Platform.OS === "ios" ? 1 : undefined}
          onSlideChange={onSlideChange}
        >
          <Slides.Content>
            {Array.from({ length: PRODUCT_TOUR_TOTAL_SLIDES }, (_, index) => (
              <Slides.Content.Item key={index}>
                <SlideItem index={index} />
              </Slides.Content.Item>
            ))}
          </Slides.Content>

          <Slides.ProgressIndicator style={styles.progressIndicator}>
            <ProgressIndicator />
          </Slides.ProgressIndicator>

          <Slides.Footer>
            <SlideFooterButton closeDrawer={closeDrawer} />
          </Slides.Footer>
        </Slides>
      </BottomSheetView>
    </QueuedDrawerBottomSheet>
  );
};

const styles = StyleSheet.create({
  progressIndicator: {
    marginVertical: 24,
  },
});
