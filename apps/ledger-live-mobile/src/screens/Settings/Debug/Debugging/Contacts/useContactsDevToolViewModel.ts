import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useFeature } from "@features/platform-feature-flags";
import { DEFAULT_ELIGIBLE_ADDRESS_FAMILIES } from "@features/flow-contacts";
import { setOverride } from "@shared/feature-flags";
import { CONTACTS_FLAG } from "./constants";

export function useContactsDevToolViewModel() {
  const dispatch = useDispatch();
  const featureFlag = useFeature(CONTACTS_FLAG);
  const isEnabled = featureFlag?.enabled ?? false;
  const newBadge = featureFlag?.params?.newBadge ?? false;

  const eligibleAddressFamilies = useMemo(
    () => featureFlag?.params?.eligibleAddressFamilies ?? [...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES],
    [featureFlag?.params?.eligibleAddressFamilies],
  );

  const dispatchOverride = useCallback(
    (value: {
      enabled: boolean;
      params: {
        newBadge: boolean;
        eligibleAddressFamilies: readonly string[];
      };
    }) => {
      dispatch(
        setOverride({
          key: CONTACTS_FLAG,
          value: { ...featureFlag, ...value },
        }),
      );
    },
    [dispatch, featureFlag],
  );

  const handleToggleEnabled = useCallback(() => {
    dispatchOverride({
      enabled: !isEnabled,
      params: {
        newBadge,
        eligibleAddressFamilies,
      },
    });
  }, [dispatchOverride, isEnabled, newBadge, eligibleAddressFamilies]);

  const handleToggleNewBadge = useCallback(() => {
    dispatchOverride({
      enabled: isEnabled,
      params: {
        newBadge: !newBadge,
        eligibleAddressFamilies,
      },
    });
  }, [dispatchOverride, isEnabled, newBadge, eligibleAddressFamilies]);

  const handleSetEligibleAddressFamilies = useCallback(
    (families: readonly string[]) => {
      dispatchOverride({
        enabled: isEnabled,
        params: {
          newBadge,
          eligibleAddressFamilies: [...families],
        },
      });
    },
    [dispatchOverride, isEnabled, newBadge],
  );

  const handleRestoreDefaults = useCallback(() => {
    dispatch(setOverride({ key: CONTACTS_FLAG, value: undefined }));
  }, [dispatch]);

  return {
    featureFlag,
    isEnabled,
    newBadge,
    eligibleAddressFamilies,
    handleToggleEnabled,
    handleToggleNewBadge,
    handleSetEligibleAddressFamilies,
    handleRestoreDefaults,
  };
}
