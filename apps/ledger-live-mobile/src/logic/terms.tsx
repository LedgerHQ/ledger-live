import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  MutableRefObject,
} from "react";
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

async function isAcceptedTerms() {
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

async function unAcceptTerms() {
  await AsyncStorage.removeItem("acceptedTermsVersion");
}

async function acceptTerms() {
  await AsyncStorage.setItem("acceptedTermsVersion", currentTermsRequired);
}

const acceptTermsAndUpdateStateRef: MutableRefObject<(() => void) | null> =
  React.createRef();

export function acceptTermsAndUpdateState() {
  if (acceptTermsAndUpdateStateRef.current)
    acceptTermsAndUpdateStateRef.current();
  else acceptTerms();
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

type AcceptedTermsContextValue = {
  accepted: boolean;
  accept: () => Promise<boolean>;
  unAccept: () => Promise<boolean>;
};

export const AcceptedTermsContext =
  React.createContext<AcceptedTermsContextValue>({
    accepted: false,
    accept: () => Promise.resolve(false),
    unAccept: () => Promise.resolve(false),
  });

export const AcceptedTermsContextProvider: React.FC<{
  children?: React.ReactNode | null | undefined;
}> = ({ children }) => {
  const [accepted, setAccepted] = useState(true);

  const unAccept = useCallback(
    () =>
      unAcceptTerms()
        .then(() => {
          setAccepted(false);
          return true;
        })
        .catch(() => false),
    [],
  );

  const accept = useCallback(
    () =>
      acceptTerms()
        .then(() => {
          setAccepted(true);
          return true;
        })
        .catch(() => false),
    [],
  );

  useEffect(() => {
    if (!acceptTermsAndUpdateStateRef.current)
      acceptTermsAndUpdateStateRef.current = accept;
    isAcceptedTerms().then(setAccepted);
    return () => {
      acceptTermsAndUpdateStateRef.current = null;
    };
  }, [accept]);

  const value = useMemo(
    () => ({ accepted, accept, unAccept }),
    [accept, accepted, unAccept],
  );

  return (
    <AcceptedTermsContext.Provider value={value}>
      {children}
    </AcceptedTermsContext.Provider>
  );
};
