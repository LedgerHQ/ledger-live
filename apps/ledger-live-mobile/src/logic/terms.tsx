import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useLocale } from "~/context/Locale";
import { urls } from "~/utils/urls";
import { generalTermsVersionAcceptedSelector } from "~/reducers/settings";
import { setGeneralTermsVersionAccepted } from "~/actions/settings";
import { StoreType } from "~/context/LedgerStore";

const generalTermsVersionRequired = "2022-05-10";

/**
 * Legacy storage data: we used to save the accepted version directly in
 * AsyncStorage. Now we use the state.settings part of the Redux store.
 * Do not write anything new at this storage key.
 * The migration of that data is done in the `GeneralTermsContextProvider`
 * component below.
 * */
const LEGACY_ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY = "acceptedTermsVersion";
async function loadLegacyStorageAcceptedTermsVersion() {
  return AsyncStorage.getItem(LEGACY_ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY);
}
async function eraseLegacyStorageAcceptedTermsVersion() {
  AsyncStorage.removeItem(LEGACY_ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY);
}

function isAcceptedVersionUpToDate({
  acceptedVersion,
  requiredVersion,
}: {
  acceptedVersion?: string;
  requiredVersion: string;
}) {
  if (!acceptedVersion) {
    return false;
  }
  try {
    const acceptedTermsVersion = new Date(acceptedVersion);
    const currentTermsVersion = new Date(requiredVersion);
    return acceptedTermsVersion >= currentTermsVersion;
  } catch (error) {
    console.error(`Failed to parse terms version's dates: ${error}`);
    return false;
  }
}

export function acceptGeneralTerms(store: StoreType) {
  store.dispatch(setGeneralTermsVersionAccepted(generalTermsVersionRequired));
}

export function useUnacceptGeneralTerms() {
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(setGeneralTermsVersionAccepted(undefined));
  }, [dispatch]);
}

export function useAcceptGeneralTerms() {
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(setGeneralTermsVersionAccepted(generalTermsVersionRequired));
  }, [dispatch]);
}

export function useGeneralTermsAccepted(): boolean {
  const generalTermsVersionAccepted = useSelector(generalTermsVersionAcceptedSelector);
  return isAcceptedVersionUpToDate({
    acceptedVersion: generalTermsVersionAccepted,
    requiredVersion: generalTermsVersionRequired,
  });
}

export const TermsAndConditionMigrateLegacyData = (): null => {
  const dispatch = useDispatch();
  useEffect(() => {
    /**
     * migration of the "accepted version" data from legacy storage key to redux
     * store (where it's stored as part of the settings)
     * */
    loadLegacyStorageAcceptedTermsVersion().then(res => {
      if (res) {
        dispatch(setGeneralTermsVersionAccepted(res));
        eraseLegacyStorageAcceptedTermsVersion();
      }
    });
  }, [dispatch]);
  return null;
};

export function useLocalizedTermsUrl() {
  const { locale } = useLocale();

  return (urls.terms as Record<string, string>)[locale] || urls.terms.en;
}
