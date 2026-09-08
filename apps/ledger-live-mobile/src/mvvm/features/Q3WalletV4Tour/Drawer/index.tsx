import React from "react";
import { Slides } from "@ledgerhq/native-ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { BottomSheetHeader, BottomSheetView } from "@ledgerhq/lumen-ui-rnative";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { QueuedBottomSheet } from "@shared/ui-queued-bottom-sheet";
import { Platform } from "react-native";
import { TrackScreen } from "~/analytics";
import { useQ3WalletV4TourDrawerViewModel } from "./hooks/useQ3WalletV4TourDrawerViewModel";
import { SlideItem } from "./components/SlideItem";
import { SlideFooterButton } from "./components/SlideFooterButton";
import { ProgressIndicator } from "./components/ProgressIndicator";
import {
  PAGE_TRACKING_Q3_WALLET_V4_TOUR,
  Q3_WALLET_V4_TOUR_SLIDES,
  SLIDES_CONTAINER_HEIGHT,
  SLIDES_LIST_HEIGHT,
} from "./const";

export const useQ3WalletV4TourDrawer = () => useQ3WalletV4TourDrawerViewModel();

const AnimatedGestureHandlerFlatList = Animated.createAnimatedComponent(FlatList);

type Q3WalletV4TourDrawerProps = Omit<
  ReturnType<typeof useQ3WalletV4TourDrawerViewModel>,
  "handleOpenDrawer"
> & {
  readonly source?: string;
};

export const Q3WalletV4TourDrawer = ({
  isDrawerOpen,
  handleCloseDrawer,
  closeDrawer,
  onSlideChange,
  source = "Portfolio",
}: Q3WalletV4TourDrawerProps) => {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const styles = useStyleSheet(
    theme => ({
      content: {
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: bottomInset + theme.spacings.s8,
      },
      slidesContainer: {
        height: SLIDES_CONTAINER_HEIGHT,
      },
      slidesList: {
        height: SLIDES_LIST_HEIGHT,
      },
      progressIndicator: {
        marginTop: theme.spacings.s56,
        marginBottom: theme.spacings.s32,
      },
    }),
    [bottomInset],
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
          <TrackScreen
            category={PAGE_TRACKING_Q3_WALLET_V4_TOUR}
            source={source}
            refreshSource={false}
          />
          <Slides
            bounces={false}
            as={AnimatedGestureHandlerFlatList}
            testID="q3-wallet-v4-tour-slides-container"
            initialNumToRender={1}
            maxToRenderPerBatch={Platform.OS === "ios" ? 1 : undefined}
            onSlideChange={onSlideChange}
            style={styles.slidesContainer}
            contentContainerStyle={styles.slidesList}
          >
            <Slides.Content>
              {Q3_WALLET_V4_TOUR_SLIDES.map((slide, index) => (
                <Slides.Content.Item key={slide.titleKey}>
                  <SlideItem index={index} />
                </Slides.Content.Item>
              ))}
            </Slides.Content>

            <Slides.ProgressIndicator style={styles.progressIndicator}>
              <ProgressIndicator />
            </Slides.ProgressIndicator>

            <Slides.Footer>
              <SlideFooterButton onComplete={handleCloseDrawer} />
            </Slides.Footer>
          </Slides>
        </BottomSheetView>
      ) : null}
    </QueuedBottomSheet>
  );
};
