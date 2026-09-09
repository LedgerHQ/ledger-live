import React, { useCallback } from "react";
import { ScrollView } from "react-native";
import { Box, Text, Switch, Button } from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ2WalletV4Tour } from "~/actions/settings";
import { hasSeenQ2WalletV4TourSelector } from "~/reducers/settings";
import { Q2WalletV4TourDrawer } from "../Drawer";
import { useQ2WalletV4TourDrawerViewModel } from "../Drawer/hooks/useQ2WalletV4TourDrawerViewModel";
import { isQ2ReleaseTourEnabled } from "../releaseTourGate";

const RELEASE_TOUR_FLAG = "releaseTour";

function Q2WalletV4TourScreenDebug() {
  const dispatch = useDispatch();
  const hasSeenQ2WalletV4Tour = useSelector(hasSeenQ2WalletV4TourSelector);
  const releaseTour = useFeature(RELEASE_TOUR_FLAG);
  const isQ2TourEnabled = isQ2ReleaseTourEnabled(releaseTour);
  const { isDrawerOpen, handleOpenDrawer, handleCloseDrawer, closeDrawer, onSlideChange } =
    useQ2WalletV4TourDrawerViewModel();
  const canOpenDrawer = isQ2TourEnabled && !hasSeenQ2WalletV4Tour;

  const handleToggleQ2TourEnabled = useCallback(() => {
    const next = !isQ2TourEnabled;
    dispatch(
      setOverride({
        key: RELEASE_TOUR_FLAG,
        value: {
          ...releaseTour,
          enabled: next,
          params: { variant: next ? "q2" : releaseTour?.params?.variant },
        },
      }),
    );
  }, [releaseTour, isQ2TourEnabled, dispatch]);

  const handleToggleHasSeenQ2WalletV4Tour = useCallback(() => {
    dispatch(setHasSeenQ2WalletV4Tour(!hasSeenQ2WalletV4Tour));
  }, [dispatch, hasSeenQ2WalletV4Tour]);

  let openDrawerLabel = "Open Drawer (enable Q2 release tour)";
  if (canOpenDrawer) {
    openDrawerLabel = "Open Drawer";
  } else if (isQ2TourEnabled) {
    openDrawerLabel = "Open Drawer (reset tour seen)";
  }

  return (
    <>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box lx={{ padding: "s16", rowGap: "s24" }}>
          <Text typography="body2" lx={{ color: "muted" }}>
            Test the Q2 Wallet V4 Tour, gated by releaseTour variant q2.
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
                Q2 release tour
              </Text>
              <Text typography="body3" lx={{ color: "muted" }}>
                Toggles releaseTour enabled with variant q2.
              </Text>
            </Box>
            <Switch checked={isQ2TourEnabled} onCheckedChange={handleToggleQ2TourEnabled} />
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
                Persisted hasSeenQ2WalletV4Tour. Toggle off to replay the tour.
              </Text>
            </Box>
            <Switch
              checked={hasSeenQ2WalletV4Tour}
              onCheckedChange={handleToggleHasSeenQ2WalletV4Tour}
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

      <Q2WalletV4TourDrawer
        isDrawerOpen={isDrawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        closeDrawer={closeDrawer}
        onSlideChange={onSlideChange}
        source="Debug"
      />
    </>
  );
}

export default Q2WalletV4TourScreenDebug;
