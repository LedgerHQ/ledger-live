import { useCallback, useMemo } from "react";
import { setContacts } from "@domain/entity-contact";
import { useFeature } from "@features/platform-feature-flags";
import {
  resolveContactsFeatureParams,
  updateContactsFeatureValue,
  type ContactsFeatureValuePatch,
} from "@features/platform-contacts";
import { setOverride } from "@shared/feature-flags";
import { setHasDismissedContactsFeatureIntroduction } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { hasDismissedContactsFeatureIntroductionSelector } from "~/reducers/settings";
import { CONTACTS_FLAG } from "./constants";
import { createContactsDebugSamples, createContactsFromSendHistory } from "./mockContacts";

export function useContactsDevToolViewModel() {
  const dispatch = useDispatch();
  const accounts = useSelector(flattenAccountsSelector);
  const featureFlag = useFeature(CONTACTS_FLAG);
  const hasDismissedFeatureIntroduction = useSelector(
    hasDismissedContactsFeatureIntroductionSelector,
  );
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

  const handleLoadSamples = useCallback(() => {
    dispatch(setContacts(createContactsDebugSamples()));
  }, [dispatch]);

  const handleLoadFromSendHistory = useCallback(() => {
    dispatch(setContacts(createContactsFromSendHistory(accounts)));
  }, [dispatch, accounts]);

  const handleClearContacts = useCallback(() => {
    dispatch(setContacts([]));
  }, [dispatch]);

  const handleToggleFeatureIntroductionDismissed = useCallback(() => {
    dispatch(setHasDismissedContactsFeatureIntroduction(!hasDismissedFeatureIntroduction));
  }, [dispatch, hasDismissedFeatureIntroduction]);

  return {
    featureFlag,
    isEnabled,
    newBadge: params.newBadge,
    eligibleAddressFamilies: params.eligibleAddressFamilies,
    hasDismissedFeatureIntroduction,
    handleToggleEnabled,
    handleToggleNewBadge,
    handleToggleFeatureIntroductionDismissed,
    handleSetEligibleAddressFamilies,
    handleRestoreDefaults,
    handleLoadSamples,
    handleLoadFromSendHistory,
    handleClearContacts,
  };
}
