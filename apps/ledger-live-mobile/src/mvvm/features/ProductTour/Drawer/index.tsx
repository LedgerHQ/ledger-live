import React from "react";
import { Slides } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Box,
  BottomSheetView,
  IconButton,
  BottomSheetModalProvider,
} from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import QueuedDrawerBottomSheet from "LLM/components/QueuedDrawer/QueuedDrawerBottomSheet";
import { useTranslation } from "~/context/Locale";
import { TrackScreen } from "~/analytics";
import { useProductTourControls } from "../context/ProductTourControlsContext";
import { useProductTourDrawerViewModel } from "./hooks/useProductTourDrawerViewModel";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { PAGE_TRACKING_PRODUCT_TOUR, PRODUCT_TOUR_TOTAL_SLIDES } from "./const";
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
  const { bottom: bottomInset } = useSafeAreaInsets();

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <ForceTheme selectedPalette={"dark"}>
      <BottomSheetModalProvider>
        <QueuedDrawerBottomSheet
          isRequestingToBeOpened={isDrawerOpen}
          onClose={closeProductTour}
          noCloseButton
          snapPoints={Platform.OS === "ios" ? ["80%", "90%"] : ["90%"]}
        >
          <BottomSheetView>
            <Box lx={{ flexDirection: "row", justifyContent: "flex-end", paddingBottom: "s12" }}>
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

              <Slides.Footer style={{ marginBottom: bottomInset }}>
                <SlideFooterButton
                  onPrimaryAction={onPrimaryAction}
                  onComplete={completeProductTour}
                />
              </Slides.Footer>
            </Slides>
          </BottomSheetView>
        </QueuedDrawerBottomSheet>
      </BottomSheetModalProvider>
    </ForceTheme>
  );
};

const styles = StyleSheet.create({
  progressIndicator: {
    marginVertical: 24,
  },
});
