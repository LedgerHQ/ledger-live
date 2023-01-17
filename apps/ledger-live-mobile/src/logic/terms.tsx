import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useLocale } from "../context/Locale";
import { urls } from "../config/urls";

const currentTermsRequired = "2022-05-10";
const currentLendingTermsRequired = "2020-11-10";

function isAcceptedVersionUpToDate(
  acceptedVersion: string,
  currentVersion: string,
) {
  if (!acceptedVersion) {
    return false;
  }

  try {
    const acceptedTermsVersion = new Date(acceptedVersion);
    const currentTermsVersion = new Date(currentVersion);

    return acceptedTermsVersion >= currentTermsVersion;
  } catch (error) {
    console.error(`Failed to parse terms version's dates: ${error}`);

    return false;
  }
}

export async function isAcceptedTerms() {
  const acceptedTermsVersion = await AsyncStorage.getItem(
    "acceptedTermsVersion",
  );

  if (!acceptedTermsVersion) {
    return false;
  }

  return isAcceptedVersionUpToDate(acceptedTermsVersion, currentTermsRequired);
}

export async function isAcceptedLendingTerms() {
  const acceptedLendingTermsVersion = await AsyncStorage.getItem(
    "acceptedLendingTermsVersion",
  );

  if (!acceptedLendingTermsVersion) {
    return false;
  }

  return isAcceptedVersionUpToDate(
    acceptedLendingTermsVersion,
    currentLendingTermsRequired,
  );
}

export async function unAcceptTerms() {
  await AsyncStorage.removeItem("acceptedTermsVersion");
}

export async function acceptTerms() {
  await AsyncStorage.setItem("acceptedTermsVersion", currentTermsRequired);
}

export async function acceptLendingTerms() {
  await AsyncStorage.setItem(
    "acceptedLendingTermsVersion",
    currentLendingTermsRequired,
  );
}

export function useLocalizedTermsUrl() {
  const { locale } = useLocale();

  return (urls.terms as Record<string, string>)[locale] || urls.terms.en;
}

export const useTermsAccept = () => {
  const [accepted, setAccepted] = useState(true);

  const unAccept = useCallback(() => {
    unAcceptTerms().then(() => {
      setAccepted(false);
    });
  }, []);

  const accept = useCallback(() => {
    acceptTerms().then(() => {
      setAccepted(true);
    });
  }, []);

  useEffect(() => {
    isAcceptedTerms().then(setAccepted);
  }, []);

  return [accepted, accept, unAccept] as const;
};
