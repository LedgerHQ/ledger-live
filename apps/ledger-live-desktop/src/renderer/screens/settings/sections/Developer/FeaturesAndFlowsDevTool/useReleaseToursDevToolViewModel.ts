import { useCallback } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride } from "@shared/feature-flags";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { hasSeenQ2TourSelector, hasSeenQ3TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenQ2Tour, setHasSeenQ3Tour } from "~/renderer/actions/settings";
import {
  isQ2ReleaseTourEnabled,
  isQ3ReleaseTourEnabled,
} from "LLD/features/Q2Tour/releaseTourGate";
import { isQ3TourVariant, type Q3TourVariant } from "LLD/features/Q3Tour/Drawer/const";

const RELEASE_TOUR_FLAG = "releaseTour";

export function useReleaseToursDevToolViewModel() {
  const dispatch = useDispatch();
  const releaseTour = useFeature(RELEASE_TOUR_FLAG);
  const hasSeenQ2Tour = useSelector(hasSeenQ2TourSelector);
  const hasSeenQ3Tour = useSelector(hasSeenQ3TourSelector);
  const isQ2TourEnabled = isQ2ReleaseTourEnabled(releaseTour);
  const isQ3TourEnabled = isQ3ReleaseTourEnabled(releaseTour);
  const selectedQ3TourVariant: Q3TourVariant = isQ3TourVariant(releaseTour?.params?.variant)
    ? releaseTour.params.variant
    : "q3_a";

  const handleToggleQ2TourHasSeen = useCallback(() => {
    dispatch(setHasSeenQ2Tour(!hasSeenQ2Tour));
  }, [dispatch, hasSeenQ2Tour]);

  const handleToggleQ2TourEnabled = useCallback(() => {
    const enabled = !isQ2TourEnabled;
    dispatch(
      setOverride({
        key: RELEASE_TOUR_FLAG,
        value: {
          enabled,
          params: { variant: enabled ? "q2" : releaseTour?.params?.variant },
        },
      }),
    );
  }, [dispatch, isQ2TourEnabled, releaseTour]);

  const handleToggleQ3TourHasSeen = useCallback(() => {
    dispatch(setHasSeenQ3Tour(!hasSeenQ3Tour));
  }, [dispatch, hasSeenQ3Tour]);

  const handleToggleQ3TourEnabled = useCallback(() => {
    const enabled = !isQ3TourEnabled;
    dispatch(
      setOverride({
        key: RELEASE_TOUR_FLAG,
        value: {
          enabled,
          params: { variant: enabled ? selectedQ3TourVariant : releaseTour?.params?.variant },
        },
      }),
    );
  }, [dispatch, isQ3TourEnabled, releaseTour, selectedQ3TourVariant]);

  const handleQ3TourVariantChange = useCallback(
    (variant: string) => {
      if (!isQ3TourVariant(variant)) return;
      dispatch(
        setOverride({
          key: RELEASE_TOUR_FLAG,
          value: {
            enabled: releaseTour?.enabled ?? false,
            params: { variant },
          },
        }),
      );
    },
    [dispatch, releaseTour?.enabled],
  );

  return {
    hasSeenQ2Tour,
    isQ2TourEnabled,
    hasSeenQ3Tour,
    isQ3TourEnabled,
    selectedQ3TourVariant,
    handleToggleQ2TourHasSeen,
    handleToggleQ2TourEnabled,
    handleToggleQ3TourHasSeen,
    handleToggleQ3TourEnabled,
    handleQ3TourVariantChange,
  };
}
