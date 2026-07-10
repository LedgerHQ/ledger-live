import React, { useCallback, useState } from "react";
import { Slides } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { LayoutChangeEvent, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, BottomSheetView, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { useProductTourControls } from "../context/ProductTourControlsContext";
import { useProductTourDrawerViewModel } from "./hooks/useProductTourDrawerViewModel";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { ProgressIndicator } from "./components/ProgressIndicator";
import {
  PAGE_TRACKING_PRODUCT_TOUR,
  PRODUCT_TOUR_SHEET_CHROME_HEIGHT,
  PRODUCT_TOUR_SLIDES_LIST_HEIGHT,
  PRODUCT_TOUR_SLIDES_LIST_MIN_HEIGHT,
  PRODUCT_TOUR_TOTAL_SLIDES,
} from "./const";
import ForceTheme from "~/components/theme/ForceTheme";

export const useProductTourDrawer = () => useProductTourDrawerViewModel();

const AnimatedGestureHandlerFlatList = Animated.createAnimatedComponent(FlatList);

export const ProductTourDrawer = () => {
  const {
    isDrawerOpen,
    closeProductTour,
    onCloseButtonPress,
    onSlideChange,
    onPrimaryAction,
    completeProductTour,
  } = useProductTourControls();
  const { t } = useTranslation();
  const { top: topInset, bottom: bottomInset } = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();

  // QueuedDrawerBottomSheet already injects the Android bottom safe-area spacer, so only iOS adds it.
  const bottomSafeArea = Platform.OS === "ios" ? bottomInset : 0;

  // Max content height before the sheet clips it; the layout pass resizes the slides area to fit.
  const contentCeiling =
    windowHeight - topInset - bottomSafeArea - PRODUCT_TOUR_SHEET_CHROME_HEIGHT;

  const [slidesListHeight, setSlidesListHeight] = useState(PRODUCT_TOUR_SLIDES_LIST_HEIGHT);

  const handleContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const measuredHeight = event.nativeEvent.layout.height;
      // The non-slides height (chrome + paddings) is constant, so derive the slides area that fits
      // the ceiling. Recomputing on every layout lets it grow back when space returns (rotation).
      setSlidesListHeight(prev => {
        const nonSlidesHeight = measuredHeight - prev;
        const available = Math.floor(contentCeiling - nonSlidesHeight);
        return Math.min(
          PRODUCT_TOUR_SLIDES_LIST_HEIGHT,
          Math.max(PRODUCT_TOUR_SLIDES_LIST_MIN_HEIGHT, available),
        );
      });
    },
    [contentCeiling],
  );

  return (
    // Outer ForceTheme styles the sheet itself (background/handle resolved via useTheme).
    <ForceTheme selectedPalette={"dark"}>
      <QueuedDrawerBottomSheet
        isRequestingToBeOpened={isDrawerOpen}
        onClose={closeProductTour}
        noCloseButton
        enableDynamicSizing
        maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : undefined}
      >
        {isDrawerOpen ? (
          // Inner ForceTheme: the sheet portals its children, so context must be re-applied here.
          <ForceTheme selectedPalette={"dark"}>
            <BottomSheetView>
              <View onLayout={handleContentLayout} style={{ paddingBottom: bottomSafeArea + 8 }}>
                <Box
                  lx={{ flexDirection: "row", justifyContent: "flex-end", paddingBottom: "s12" }}
                >
                  <IconButton
                    icon={Close}
                    appearance="transparent"
                    size="xs"
                    onPress={onCloseButtonPress}
                    accessibilityLabel={t("common.close")}
                    testID="product-tour-close-button"
                  />
                </Box>
                <TrackScreen page={PAGE_TRACKING_PRODUCT_TOUR} />
                <Slides
                  bounces={false}
                  as={AnimatedGestureHandlerFlatList}
                  testID="product-tour-slides-container"
                  initialNumToRender={1}
                  maxToRenderPerBatch={Platform.OS === "ios" ? 1 : undefined}
                  onSlideChange={onSlideChange}
                  style={styles.slides}
                  contentContainerStyle={{ height: slidesListHeight }}
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
                    <SlideFooterButton
                      onPrimaryAction={onPrimaryAction}
                      onComplete={completeProductTour}
                    />
                  </Slides.Footer>
                </Slides>
              </View>
            </BottomSheetView>
          </ForceTheme>
        ) : null}
      </QueuedDrawerBottomSheet>
    </ForceTheme>
  );
};

const styles = StyleSheet.create({
  // Override Slides' default flex:1 so it wraps its content and can be measured.
  slides: {
    flex: 0,
  },
  progressIndicator: {
    marginVertical: 24,
  },
});
