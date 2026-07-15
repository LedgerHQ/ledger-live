import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  parseEligibleAddressFamiliesInput,
  resolveContactsFeatureParams,
  updateContactsFeatureValue,
  type ContactsFeatureValuePatch,
} from "@features/flow-contacts";
import { setOverride } from "@shared/feature-flags";
import { CONTACTS_FLAG } from "../constants";
import { ContactsDevToolViewModel } from "../types";

export const useContactsDevToolViewModel = (): ContactsDevToolViewModel => {
  const dispatch = useDispatch();
  const featureFlag = useFeature(CONTACTS_FLAG);
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

  const handleResetOverride = useCallback(() => {
    dispatch(setOverride({ key: CONTACTS_FLAG, value: undefined }));
  }, [dispatch]);

  return {
    featureFlag,
    isEnabled,
    params,
    customFamiliesInput,
    handleToggleEnabled,
    handleToggleNewBadge,
    handleSetEligibleAddressFamilies,
    setCustomFamiliesInput,
    handleApplyCustomFamilies,
    handleResetOverride,
  };
};
