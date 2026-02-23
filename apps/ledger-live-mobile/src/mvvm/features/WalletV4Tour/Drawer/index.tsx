import React, { useCallback, useRef } from "react";
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
import { TrackScreen, useTrack } from "~/analytics";

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
  const currentIndex = useRef(0);

  const { bottom: bottomInset } = useSafeAreaInsets();
  const track = useTrack();

  const closeDrawer = useCallback(() => {
    handleCloseDrawer();
    track("button_clicked", {
      button: "Close",
      page: "Product Tour WV4",
      card: currentIndex.current + 1,
    });
  }, [handleCloseDrawer, track]);

  if (!isDrawerOpen) {
    return null;
  }

  return (
    <QueuedDrawerGorhom
      isRequestingToBeOpened={isDrawerOpen}
      onClose={closeDrawer}
      snapPoints={["92%"]}
      noCloseButton={false}
      animateOnMount={false}
    >
      <TrackScreen page="Product Tour WV4" source="Portfolio" />
      <Slides
        bounces={false}
        as={AnimatedGestureHandlerFlatList}
        testID="walletv4-tour-slides-container"
        scrollEnabled={false}
        initialNumToRender={1}
        onSlideChange={index => {
          currentIndex.current = index;
          track("product_tour_card", {
            page: "Product Tour WV4",
            card: index + 1,
          });
        }}
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
