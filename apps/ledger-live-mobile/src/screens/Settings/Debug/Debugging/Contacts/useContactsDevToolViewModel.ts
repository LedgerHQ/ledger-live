import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  resolveContactsFeatureParams,
  updateContactsFeatureValue,
  type ContactsFeatureValuePatch,
} from "@features/flow-contacts/featureFlags";
import { setOverride } from "@shared/feature-flags";
import { CONTACTS_FLAG } from "./constants";

export function useContactsDevToolViewModel() {
  const dispatch = useDispatch();
  const featureFlag = useFeature(CONTACTS_FLAG);
  const isEnabled = featureFlag?.enabled === true;
  const params = useMemo(
    () => resolveContactsFeatureParams(featureFlag?.params),
    [featureFlag?.params],
  );

  const setContactsOverride = useCallback(
    (patch: ContactsFeatureValuePatch) => {
      dispatch(
        setOverride({
          key: CONTACTS_FLAG,
          value: updateContactsFeatureValue(featureFlag, patch),
        }),
      );
    },
    [dispatch, featureFlag],
  );

  const handleToggleEnabled = useCallback(() => {
    setContactsOverride({ enabled: !isEnabled });
  }, [isEnabled, setContactsOverride]);

  const handleToggleNewBadge = useCallback(() => {
    setContactsOverride({ params: { newBadge: !params.newBadge } });
  }, [params.newBadge, setContactsOverride]);

  const handleSetEligibleAddressFamilies = useCallback(
    (families: readonly string[]) => {
      setContactsOverride({ params: { eligibleAddressFamilies: [...families] } });
    },
    [setContactsOverride],
  );

  const handleRestoreDefaults = useCallback(() => {
    dispatch(setOverride({ key: CONTACTS_FLAG, value: undefined }));
  }, [dispatch]);

  return {
    featureFlag,
    isEnabled,
    newBadge: params.newBadge,
    eligibleAddressFamilies: params.eligibleAddressFamilies,
    handleToggleEnabled,
    handleToggleNewBadge,
    handleSetEligibleAddressFamilies,
    handleRestoreDefaults,
  };
}
