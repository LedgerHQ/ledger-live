import React, { useCallback } from "react";
import { ScrollView } from "react-native";
import {
  Box,
  Button,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Text,
} from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { setHasSeenQ3WalletV4Tour } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { hasSeenQ3WalletV4TourSelector } from "~/reducers/settings";
import { isQ3ReleaseTourEnabled } from "LLM/utils/releaseTourGate";
import { Q3WalletV4TourDrawer } from "../Drawer";
import { useQ3WalletV4TourDrawerViewModel } from "../Drawer/hooks/useQ3WalletV4TourDrawerViewModel";

const RELEASE_TOUR_FLAG = "releaseTour";
const Q3_VARIANTS = ["q3_a", "q3_b", "q3_b2"] as const;
type Q3Variant = (typeof Q3_VARIANTS)[number];

function isQ3Variant(variant: string | undefined): variant is Q3Variant {
  return variant === "q3_a" || variant === "q3_b" || variant === "q3_b2";
}

function Q3WalletV4TourScreenDebug() {
  const dispatch = useDispatch();
  const hasSeenQ3WalletV4Tour = useSelector(hasSeenQ3WalletV4TourSelector);
  const releaseTour = useFeature(RELEASE_TOUR_FLAG);
  const isQ3TourEnabled = isQ3ReleaseTourEnabled(releaseTour);
  const selectedVariant: Q3Variant = isQ3Variant(releaseTour?.params?.variant)
    ? releaseTour.params.variant
    : "q3_a";
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer, closeDrawer, onSlideChange } =
    useQ3WalletV4TourDrawerViewModel();
  const canOpenDrawer = isQ3TourEnabled && !hasSeenQ3WalletV4Tour;

  const handleToggleQ3TourEnabled = useCallback(() => {
    const next = !isQ3TourEnabled;
    dispatch(
      setOverride({
        key: RELEASE_TOUR_FLAG,
        value: {
          enabled: next,
          params: {
            variant: next ? selectedVariant : releaseTour?.params?.variant,
          },
        },
      }),
    );
  }, [dispatch, isQ3TourEnabled, releaseTour, selectedVariant]);

  const handleVariantChange = useCallback(
    (variant: string) => {
      if (!isQ3Variant(variant)) {
        return;
      }
      dispatch(
        setOverride({
          key: RELEASE_TOUR_FLAG,
          value: {
            enabled: isQ3TourEnabled,
            params: { variant },
          },
        }),
      );
    },
    [dispatch, isQ3TourEnabled],
  );

  const handleToggleHasSeenQ3WalletV4Tour = useCallback(() => {
    dispatch(setHasSeenQ3WalletV4Tour(!hasSeenQ3WalletV4Tour));
  }, [dispatch, hasSeenQ3WalletV4Tour]);

  let openDrawerLabel = "Open Drawer (enable Q3 release tour)";
  if (canOpenDrawer) {
    openDrawerLabel = "Open Drawer";
  } else if (isQ3TourEnabled) {
    openDrawerLabel = "Open Drawer (reset tour seen)";
  }

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box lx={{ padding: "s16", rowGap: "s24" }}>
          <Text typography="body2" lx={{ color: "muted" }}>
            Test the Q3 Wallet V4 Tour drawer, gated by releaseTour variants q3_a, q3_b, or q3_b2.
          </Text>

          <Box
            lx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              columnGap: "s12",
            }}
          >
            <Box lx={{ flexShrink: 1 }}>
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                Q3 release tour
              </Text>
              <Text typography="body3" lx={{ color: "muted" }}>
                Toggles releaseTour enabled. Variant is chosen below.
              </Text>
            </Box>
            <Switch
              testID="debug-q3-tour-enabled-switch"
              checked={isQ3TourEnabled}
              onCheckedChange={handleToggleQ3TourEnabled}
            />
          </Box>

          <Box lx={{ rowGap: "s8" }}>
            <Text typography="body2SemiBold" lx={{ color: "base" }}>
              Variant
            </Text>
            <SegmentedControl
              selectedValue={selectedVariant}
              onSelectedChange={handleVariantChange}
              tabLayout="fit"
              accessibilityLabel="Q3 release tour variant"
            >
              <SegmentedControlButton value="q3_a">q3_a</SegmentedControlButton>
              <SegmentedControlButton value="q3_b">q3_b</SegmentedControlButton>
              <SegmentedControlButton value="q3_b2">q3_b2</SegmentedControlButton>
            </SegmentedControl>
          </Box>

          <Box
            lx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              columnGap: "s12",
            }}
          >
            <Box lx={{ flexShrink: 1 }}>
              <Text typography="body2SemiBold" lx={{ color: "base" }}>
                Tour seen
              </Text>
              <Text typography="body3" lx={{ color: "muted" }}>
                Persisted hasSeenQ3WalletV4Tour. Toggle off to replay the tour.
              </Text>
            </Box>
            <Switch
              testID="debug-q3-tour-seen-switch"
              checked={hasSeenQ3WalletV4Tour}
              onCheckedChange={handleToggleHasSeenQ3WalletV4Tour}
            />
          </Box>

          <Box lx={{ flex: 1, justifyContent: "flex-end" }}>
            <Button
              size="lg"
              appearance="accent"
              disabled={!canOpenDrawer}
              onPress={handleOpenDrawer}
            >
              {openDrawerLabel}
            </Button>
          </Box>
        </Box>
      </ScrollView>

      <Q3WalletV4TourDrawer
        isDrawerOpen={isDrawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        closeDrawer={closeDrawer}
        onSlideChange={onSlideChange}
        source="Debug"
      />
    </>
  );
}

export default Q3WalletV4TourScreenDebug;
