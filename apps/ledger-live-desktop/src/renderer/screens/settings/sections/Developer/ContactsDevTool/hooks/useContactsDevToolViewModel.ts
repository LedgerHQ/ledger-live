import { useCallback, useEffect, useMemo, useState } from "react";
import { setContacts } from "@domain/entity-contact";
import { mockEmptyContacts, mockPopulatedContacts } from "@domain/entity-contact/schema.mock";
import { useFeature } from "@features/platform-feature-flags";
import {
  parseEligibleAddressFamiliesInput,
  resolveContactsFeatureParams,
  updateContactsFeatureValue,
  type ContactsFeatureValuePatch,
} from "@features/platform-contacts";
import { setOverride } from "@shared/feature-flags";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setHasDismissedContactsFeatureIntroduction } from "~/renderer/actions/settings";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { hasDismissedContactsFeatureIntroductionSelector } from "~/renderer/reducers/settings";
import { CONTACTS_FLAG } from "../constants";
import { createContactsFromSendHistory } from "../createContactsFromSendHistory";
import { ContactsDevToolViewModel } from "../types";

export const useContactsDevToolViewModel = (): ContactsDevToolViewModel => {
  const dispatch = useDispatch();
  const accounts = useSelector(flattenAccountsSelector);
  const featureFlag = useFeature(CONTACTS_FLAG);
  const hasDismissedFeatureIntroduction = useSelector(
    hasDismissedContactsFeatureIntroductionSelector,
  );
  const [customFamiliesInput, setCustomFamiliesInput] = useState("");

  const isEnabled = featureFlag?.enabled === true;
  const params = useMemo(
    () => resolveContactsFeatureParams(featureFlag?.params),
    [featureFlag?.params],
  );
  const familiesInput = params.eligibleAddressFamilies.join(", ");

  useEffect(() => {
    setCustomFamiliesInput(familiesInput);
  }, [familiesInput]);

  const setContactsOverride = useCallback(
    (patch: ContactsFeatureValuePatch) =>
      dispatch(
        setOverride({
          key: CONTACTS_FLAG,
          value: updateContactsFeatureValue(featureFlag, patch),
        }),
      ),
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

  const handleApplyCustomFamilies = useCallback(() => {
    handleSetEligibleAddressFamilies(parseEligibleAddressFamiliesInput(customFamiliesInput));
  }, [customFamiliesInput, handleSetEligibleAddressFamilies]);

  const handleLoadPopulatedContacts = useCallback(() => {
    dispatch(setContacts(mockPopulatedContacts()));
  }, [dispatch]);

  const handleLoadFromSendHistory = useCallback(() => {
    dispatch(setContacts(createContactsFromSendHistory(accounts)));
  }, [dispatch, accounts]);

  const handleResetContacts = useCallback(() => {
    dispatch(setContacts(mockEmptyContacts()));
  }, [dispatch]);

  const handleResetOverride = useCallback(() => {
    dispatch(setOverride({ key: CONTACTS_FLAG, value: undefined }));
  }, [dispatch]);

  const handleToggleFeatureIntroductionDismissed = useCallback(() => {
    dispatch(setHasDismissedContactsFeatureIntroduction(!hasDismissedFeatureIntroduction));
  }, [dispatch, hasDismissedFeatureIntroduction]);

  return {
    featureFlag,
    isEnabled,
    params,
    customFamiliesInput,
    hasDismissedFeatureIntroduction,
    handleToggleEnabled,
    handleToggleNewBadge,
    handleToggleFeatureIntroductionDismissed,
    handleSetEligibleAddressFamilies,
    setCustomFamiliesInput,
    handleApplyCustomFamilies,
    handleLoadPopulatedContacts,
    handleLoadFromSendHistory,
    handleResetContacts,
    handleResetOverride,
  };
};
