import React, { useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useLocale } from "../context/Locale";
import { urls } from "../config/urls";
import { store } from "../context/LedgerStore";
import { generalTermsVersionAcceptedSelector } from "../reducers/settings";
import { setGeneralTermsVersionAccepted } from "../actions/settings";

const generalTermsVersionRequired = "2022-05-10";

/**
 * Legacy storage data: we used to save the accepted version directly in
 * AsyncStorage. Now we use the state.settings part of Redux.
 * Do not write anything new at this storage key.
 * The migration of that data is done in the `GeneralTermsContextProvider`
 * component below.
 * */
const LEGACY_ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY =
  "acceptedTermsVersion";
async function loadLegacyStorageAcceptedTermsVersion() {
  return AsyncStorage.getItem(
    LEGACY_ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY,
  );
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

async function unacceptGeneralTerms() {
  store.dispatch(setGeneralTermsVersionAccepted(undefined));
}

async function setGeneralTermsAcceptedVersion(acceptedVersion: string) {
  store.dispatch(setGeneralTermsVersionAccepted(acceptedVersion));
}

export async function acceptGeneralTermsLastVersion() {
  setGeneralTermsAcceptedVersion(generalTermsVersionRequired);
}

type TermsContextValue = {
  accepted: boolean;
  accept: () => void;
  unAccept: () => void;
};

export const TermsContext = React.createContext<TermsContextValue>({
  accepted: false,
  accept: acceptGeneralTermsLastVersion,
  unAccept: unacceptGeneralTerms,
});

export const GeneralTermsContextProvider: React.FC<{
  children?: React.ReactNode | null | undefined;
}> = ({ children }) => {
  const generalTermsVersionAccepted = useSelector(
    generalTermsVersionAcceptedSelector,
  );

  useEffect(() => {
    // migration of the "accepted version" data from legacy storage key to redux
    loadLegacyStorageAcceptedTermsVersion().then(res => {
      if (res) {
        setGeneralTermsAcceptedVersion(res);
        eraseLegacyStorageAcceptedTermsVersion();
      }
    });
  }, []);

  const value = useMemo(
    () => ({
      accepted: isAcceptedVersionUpToDate({
        acceptedVersion: generalTermsVersionAccepted,
        requiredVersion: generalTermsVersionRequired,
      }),
      accept: acceptGeneralTermsLastVersion,
      unAccept: unacceptGeneralTerms,
    }),
    [generalTermsVersionAccepted],
  );

  return (
    <TermsContext.Provider value={value}>{children}</TermsContext.Provider>
  );
};

export function useLocalizedTermsUrl() {
  const { locale } = useLocale();

  return (urls.terms as Record<string, string>)[locale] || urls.terms.en;
}
