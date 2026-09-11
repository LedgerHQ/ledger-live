import React from "react";
import { Slides } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Platform } from "react-native";
import { ProgressIndicator } from "LLM/components/Slides";
import { TrackScreen } from "~/analytics";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import type { WalletV4Tour, WalletV4TourDrawerViewModel } from "./types";

const AnimatedGestureHandlerFlatList = Animated.createAnimatedComponent(FlatList);

type WalletV4TourDrawerProps = Omit<WalletV4TourDrawerViewModel, "handleOpenDrawer"> & {
  readonly tour: WalletV4Tour;
  readonly source?: string;
};

export const WalletV4TourDrawer = ({
  tour,
  isDrawerOpen,
  handleCloseDrawer,
  closeDrawer,
  onSlideChange,
  source = "Portfolio",
}: WalletV4TourDrawerProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { layout } = tour;
  const styles = useStyleSheet(
    theme => ({
      content: {
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: bottomInset + theme.spacings.s8,
      },
      slidesContainer: {
        height: layout.slidesContainerHeight,
      },
      slidesList: {
        height: layout.slidesListHeight,
      },
      progressIndicator: {
        marginTop: theme.spacings[layout.progressMarginTop],
        marginBottom: theme.spacings.s32,
      },
    }),
    [bottomInset, layout],
  );

  return (
    <QueuedBottomSheet
      isRequestingToBeOpened={isDrawerOpen}
      onClose={closeDrawer}
      enableDynamicSizing
      maxDynamicContentSize={Platform.OS === "ios" ? "fullWithOffset" : undefined}
    >
      {isDrawerOpen ? (
        <BottomSheetView style={styles.content}>
          <BottomSheetHeader />
          <TrackScreen category={tour.page} source={source} refreshSource={false} />
          <Slides
            bounces={false}
            as={AnimatedGestureHandlerFlatList}
            testID={tour.testID}
            initialNumToRender={1}
            maxToRenderPerBatch={Platform.OS === "ios" ? 1 : undefined}
            onSlideChange={onSlideChange}
            style={styles.slidesContainer}
            contentContainerStyle={styles.slidesList}
          >
            <Slides.Content>
              {tour.slides.map((slide, index) => (
                <Slides.Content.Item key={slide.titleKey}>
                  <SlideItem index={index} slide={slide} titleLayout={layout.title} />
                </Slides.Content.Item>
              ))}
            </Slides.Content>

            <Slides.ProgressIndicator style={styles.progressIndicator}>
              <ProgressIndicator />
            </Slides.ProgressIndicator>

            <Slides.Footer>
              <SlideFooterButton onComplete={handleCloseDrawer} copy={tour.copy} page={tour.page} />
            </Slides.Footer>
          </Slides>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
};

export { useWalletV4TourDrawerViewModel } from "./hooks/useWalletV4TourDrawerViewModel";
export type { WalletV4Tour, WalletV4TourDrawerViewModel, WalletV4TourSlide } from "./types";
