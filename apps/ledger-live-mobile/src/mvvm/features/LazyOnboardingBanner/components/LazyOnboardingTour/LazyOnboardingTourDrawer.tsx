import React from "react";
import { Slides } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";
import { FlatList } from "react-native-gesture-handler";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Box, BottomSheetView, IconButton } from "@ledgerhq/lumen-ui-rnative";
import { Close } from "@ledgerhq/lumen-ui-rnative/symbols";
import QueuedBottomSheet from "LLM/components/QueuedDrawer/QueuedBottomSheet";
import { ProgressIndicator } from "LLM/features/ProductTour/Drawer/components/ProgressIndicator";
import { useTranslation } from "~/context/Locale";
import ForceTheme from "~/components/theme/ForceTheme";
import { LAZY_ONBOARDING_TOUR_SLIDES } from "./content";
import { LazyOnboardingTourSlideItem } from "./LazyOnboardingTourSlideItem";
import { LazyOnboardingTourFooter } from "./LazyOnboardingTourFooter";
import { LAZY_ONBOARDING_TOUR_SHEET_SNAP_POINT } from "./const";
import type { LazyOnboardingTourDrawerViewModel } from "./useLazyOnboardingTourDrawerViewModel";

type LazyOnboardingTourDrawerProps = LazyOnboardingTourDrawerViewModel;

const AnimatedGestureHandlerFlatList = Animated.createAnimatedComponent(FlatList);

export function LazyOnboardingTourDrawer({
  isOpen,
  onClose,
  onCloseButtonPress,
  onSlideChange,
  onContinue,
  onBuy,
  onDone,
}: LazyOnboardingTourDrawerProps) {
  const { t } = useTranslation();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const bottomSafeArea = Platform.OS === "ios" ? bottomInset : 0;

  return (
    <ForceTheme selectedPalette="dark">
      <QueuedBottomSheet
        isRequestingToBeOpened={isOpen}
        onClose={onClose}
        noCloseButton
        snapPoints={[LAZY_ONBOARDING_TOUR_SHEET_SNAP_POINT]}
        testID="lazy-onboarding-tour-drawer"
      >
        {isOpen ? (
          <ForceTheme selectedPalette="dark">
            <BottomSheetView style={styles.fullHeight}>
              <View style={[styles.content, { paddingBottom: bottomSafeArea + 8 }]}>
                <Box
                  lx={{ flexDirection: "row", justifyContent: "flex-end", paddingBottom: "s12" }}
                >
                  <IconButton
                    icon={Close}
                    appearance="transparent"
                    size="xs"
                    onPress={onCloseButtonPress}
                    accessibilityLabel={t("common.close")}
                    testID="lazy-onboarding-tour-close-button"
                  />
                </Box>
                <Slides
                  bounces={false}
                  as={AnimatedGestureHandlerFlatList}
                  testID="lazy-onboarding-tour-slides-container"
                  initialNumToRender={1}
                  maxToRenderPerBatch={Platform.OS === "ios" ? 1 : undefined}
                  onSlideChange={onSlideChange}
                  style={styles.slides}
                >
                  <Slides.Content style={styles.slides}>
                    {LAZY_ONBOARDING_TOUR_SLIDES.map(slide => (
                      <Slides.Content.Item key={slide.titleKey}>
                        <LazyOnboardingTourSlideItem {...slide} />
                      </Slides.Content.Item>
                    ))}
                  </Slides.Content>

                  <Slides.ProgressIndicator style={styles.progressIndicator}>
                    <ProgressIndicator />
                  </Slides.ProgressIndicator>

                  <Slides.Footer>
                    <LazyOnboardingTourFooter
                      onContinue={onContinue}
                      onBuy={onBuy}
                      onDone={onDone}
                    />
                  </Slides.Footer>
                </Slides>
              </View>
            </BottomSheetView>
          </ForceTheme>
        ) : null}
      </QueuedBottomSheet>
    </ForceTheme>
  );
}

const styles = StyleSheet.create({
  fullHeight: {
    height: "100%",
  },
  content: {
    flex: 1,
  },
  slides: {
    flex: 1,
  },
  progressIndicator: {
    marginVertical: 24,
  },
});
