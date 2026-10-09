import { useCallback, useMemo, useState } from "react";
import { setContacts } from "@domain/entity-contact";
import {
  mockContactsFromSendHistory,
  mockEmptyContacts,
  mockPopulatedContacts,
} from "@domain/entity-contact/schema.mock";
import { useFeature } from "@features/platform-feature-flags";
import {
  parseEligibleAddressFamiliesInput,
  parseExcludedCurrencyIdsInput,
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
import { ContactsDevToolViewModel } from "../types";

export const useContactsDevToolViewModel = (): ContactsDevToolViewModel => {
  const dispatch = useDispatch();
  const accounts = useSelector(flattenAccountsSelector);
  const featureFlag = useFeature(CONTACTS_FLAG);
  const hasDismissedFeatureIntroduction = useSelector(
    hasDismissedContactsFeatureIntroductionSelector,
  );
  const [customFamiliesDraft, setCustomFamiliesDraft] = useState<string | null>(null);
  const [excludedCurrencyIdsDraft, setExcludedCurrencyIdsDraft] = useState<string | null>(null);

  const isEnabled = featureFlag?.enabled === true;
  const params = useMemo(
    () => resolveContactsFeatureParams(featureFlag?.params),
    [featureFlag?.params],
  );
  const customFamiliesInput = customFamiliesDraft ?? params.eligibleAddressFamilies.join(", ");
  const excludedCurrencyIdsInput =
    excludedCurrencyIdsDraft ?? params.excludedCurrencyIds.join(", ");

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
      setCustomFamiliesDraft(null);
    },
    [setContactsOverride],
  );

  const handleApplyCustomFamilies = useCallback(() => {
    handleSetEligibleAddressFamilies(parseEligibleAddressFamiliesInput(customFamiliesInput));
  }, [customFamiliesInput, handleSetEligibleAddressFamilies]);

  const handleApplyExcludedCurrencyIds = useCallback(() => {
    setContactsOverride({
      params: { excludedCurrencyIds: parseExcludedCurrencyIdsInput(excludedCurrencyIdsInput) },
    });
    setExcludedCurrencyIdsDraft(null);
  }, [excludedCurrencyIdsInput, setContactsOverride]);

  const handleLoadPopulatedContacts = useCallback(() => {
    dispatch(setContacts(mockPopulatedContacts()));
  }, [dispatch]);

  const handleLoadFromSendHistory = useCallback(() => {
    dispatch(setContacts(mockContactsFromSendHistory(accounts)));
  }, [dispatch, accounts]);

  const handleResetContacts = useCallback(() => {
    dispatch(setContacts(mockEmptyContacts()));
  }, [dispatch]);

  const handleResetOverride = useCallback(() => {
    dispatch(setOverride({ key: CONTACTS_FLAG, value: undefined }));
    setCustomFamiliesDraft(null);
    setExcludedCurrencyIdsDraft(null);
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
    setCustomFamiliesInput: setCustomFamiliesDraft,
    handleApplyCustomFamilies,
    excludedCurrencyIdsInput,
    setExcludedCurrencyIdsInput: setExcludedCurrencyIdsDraft,
    handleApplyExcludedCurrencyIds,
    handleLoadPopulatedContacts,
    handleLoadFromSendHistory,
    handleResetContacts,
    handleResetOverride,
  };
};
