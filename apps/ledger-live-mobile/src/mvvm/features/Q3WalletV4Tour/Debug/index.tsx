import React, { useCallback } from "react";
import { ScrollView } from "react-native";
import { Box, Button, Switch, Text } from "@ledgerhq/lumen-ui-rnative";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { setHasSeenQ3WalletV4Tour } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { hasSeenQ3WalletV4TourSelector } from "~/reducers/settings";
import { isQ3ReleaseTourEnabled } from "LLM/utils/releaseTourGate";

const RELEASE_TOUR_FLAG = "releaseTour";

function Q3WalletV4TourScreenDebug() {
  const dispatch = useDispatch();
  const hasSeenQ3WalletV4Tour = useSelector(hasSeenQ3WalletV4TourSelector);
  const releaseTour = useFeature(RELEASE_TOUR_FLAG);
  const isQ3TourEnabled = isQ3ReleaseTourEnabled(releaseTour);

  const handleToggleQ3TourEnabled = useCallback(() => {
    const next = !isQ3TourEnabled;
    dispatch(
      setOverride({
        key: RELEASE_TOUR_FLAG,
        value: {
          enabled: next,
          params: { variant: next ? "q3_a" : releaseTour?.params?.variant },
        },
      }),
    );
  }, [dispatch, isQ3TourEnabled, releaseTour]);

  const handleToggleHasSeenQ3WalletV4Tour = useCallback(() => {
    dispatch(setHasSeenQ3WalletV4Tour(!hasSeenQ3WalletV4Tour));
  }, [dispatch, hasSeenQ3WalletV4Tour]);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Box lx={{ padding: "s16", rowGap: "s24" }}>
        <Text typography="body2" lx={{ color: "muted" }}>
          Test the Q3 Wallet V4 Tour setup, gated by releaseTour variants q3_a, q3_b, or q3_b2.
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
              Toggles releaseTour enabled with variant q3_a.
            </Text>
          </Box>
          <Switch
            testID="debug-q3-tour-enabled-switch"
            checked={isQ3TourEnabled}
            onCheckedChange={handleToggleQ3TourEnabled}
          />
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
          <Button size="lg" appearance="accent" disabled>
            Open Drawer (coming soon)
          </Button>
        </Box>
      </Box>
    </ScrollView>
  );
}

export default Q3WalletV4TourScreenDebug;
