import React, { useCallback } from "react";
import { Slides } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { Platform, StyleSheet } from "react-native";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { TrackScreen } from "~/analytics";
import { useProductTourControls } from "../context/ProductTourControlsContext";
import { useProductTourDrawerViewModel } from "./hooks/useProductTourDrawerViewModel";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_TOTAL_SLIDES } from "./const";

export const useProductTourDrawer = () => useProductTourDrawerViewModel();

const AnimatedGestureHandlerFlatList = Animated.createAnimatedComponent(FlatList);

export const ProductTourDrawer = () => {
  const controls = useProductTourControls();

  const resolvedIsDrawerOpen = controls?.isDrawerOpen ?? false;
  const closeProductTour = controls?.closeProductTour;
  const onSlideChange = controls?.onSlideChange;

  const resolvedOnSlideChange = useCallback((index: number) => onSlideChange?.(index), [onSlideChange]);

  const resolvedCloseDrawer = useCallback(() => closeProductTour?.(), [closeProductTour]);

  if (!resolvedIsDrawerOpen) {
    return null;
  }

  return (
    <QueuedDrawerBottomSheet isRequestingToBeOpened={resolvedIsDrawerOpen} onClose={resolvedCloseDrawer}>
      <BottomSheetView>
        <BottomSheetHeader />
        <TrackScreen page={PAGE_TRACKING_PRODUCT_TOUR} />
        <Slides
          bounces={false}
          as={AnimatedGestureHandlerFlatList}
          testID="product-tour-slides-container"
          initialNumToRender={1}
          maxToRenderPerBatch={Platform.OS === "ios" ? 1 : undefined}
          onSlideChange={resolvedOnSlideChange}
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
            <SlideFooterButton closeDrawer={resolvedCloseDrawer} />
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
