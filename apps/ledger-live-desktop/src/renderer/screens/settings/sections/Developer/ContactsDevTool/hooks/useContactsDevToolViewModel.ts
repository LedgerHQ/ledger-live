import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import { setOverride, type Features } from "@shared/feature-flags";
import { CONTACTS_FLAG, DEFAULT_ELIGIBLE_ADDRESS_FAMILIES } from "../constants";
import { ContactsDevToolViewModel, ContactsFeatureParams } from "../types";

type ContactsFeatureFlag = Features["lwdContacts"];

const parseFamiliesInput = (value: string): string[] => {
  const seen = new Set<string>();
  const families: string[] = [];

  for (const part of value.split(",")) {
    const family = part.trim().toLowerCase();
    if (family && !seen.has(family)) {
      seen.add(family);
      families.push(family);
    }
  }

  return families;
};

export const useContactsDevToolViewModel = (): ContactsDevToolViewModel => {
  const dispatch = useDispatch();
  const featureFlag = useFeature(CONTACTS_FLAG);
  const [customFamiliesInput, setCustomFamiliesInput] = useState("");

  const isEnabled = featureFlag?.enabled ?? false;

  const params = useMemo<ContactsFeatureParams>(() => {
    const flagParams = featureFlag?.params;

    return {
      newBadge: flagParams?.newBadge ?? false,
      eligibleAddressFamilies:
        flagParams?.eligibleAddressFamilies ?? DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
    };
  }, [featureFlag?.params]);

  useEffect(() => {
    setCustomFamiliesInput(params.eligibleAddressFamilies.join(", "));
  }, [params.eligibleAddressFamilies]);

  const setContactsOverride = useCallback(
    (patch: { enabled?: boolean; params?: Partial<ContactsFeatureParams> }) => {
      const currentFamilies: string[] = featureFlag?.params?.eligibleAddressFamilies ?? [
        ...DEFAULT_ELIGIBLE_ADDRESS_FAMILIES,
      ];

      const nextEligibleAddressFamilies: string[] =
        patch.params?.eligibleAddressFamilies !== undefined
          ? [...patch.params.eligibleAddressFamilies]
          : currentFamilies;

      const nextValue: ContactsFeatureFlag = {
        ...(featureFlag ?? {}),
        enabled: patch.enabled ?? isEnabled,
        params: {
          newBadge: patch.params?.newBadge ?? params.newBadge,
          eligibleAddressFamilies: nextEligibleAddressFamilies,
        },
      };

      dispatch(setOverride({ key: CONTACTS_FLAG, value: nextValue }));
    },
    [dispatch, featureFlag, isEnabled, params],
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
    handleSetEligibleAddressFamilies(parseFamiliesInput(customFamiliesInput));
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
