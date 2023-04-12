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

/**
 * NB: this implementation is not great, we should have just implemented this
 * with the settings reducer. It would make everything much simpler. No
 * context provider needed, no weird exposition of refs.
 * Feel free to refactor and handle the migration.
 * */

const generalTermsVersionRequired = "2022-05-10";
const ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY = "acceptedTermsVersion";

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

async function isAcceptedTerms(
  storageKey: string,
  termsRequiredVersion: string,
) {
  const acceptedTermsVersion = await AsyncStorage.getItem(storageKey);
  if (!acceptedTermsVersion) {
    return false;
  }
  return isAcceptedVersionUpToDate(acceptedTermsVersion, termsRequiredVersion);
}

async function isAcceptedGeneralTerms() {
  return isAcceptedTerms(
    ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY,
    generalTermsVersionRequired,
  );
}

async function setGeneralTermsNotAccepted() {
  await AsyncStorage.removeItem(ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY);
}

async function setGeneralTermsLastVersionAccepted() {
  await AsyncStorage.setItem(
    ACCEPTED_GENERAL_TERMS_VERSION_STORAGE_KEY,
    generalTermsVersionRequired,
  );
}

/**
 * This is used to expose a method that updates the internal state of
 * `AcceptedTermsContextProvider`.
 * It's a needed workaround as this functionality needs to be accessed outside
 * of the React scope. (Needed for the e2e bridge).
 */
const acceptGeneralTermsAndUpdateStateRef: MutableRefObject<
  (() => void) | null
> = React.createRef();

export function acceptGeneralTermsAndUpdateState() {
  if (acceptGeneralTermsAndUpdateStateRef.current) {
    /**
     * This condition means the `AcceptedTermsContextProvider` is mounted.
     * This call will update the state in the `AcceptedTermsContextProvider`.
     * */
    acceptGeneralTermsAndUpdateStateRef.current();
  } else {
    /**
     * If the `AcceptedTermsContextProvider` is not mounted yet, then we just
     * change the value in storage.
     * When `AcceptedTermsContextProvider` mounts, it will pick up this value and
     * update its state.
     * */
    setGeneralTermsLastVersionAccepted();
  }
}

type TermsContextValue = {
  accepted: boolean;
  accept: () => Promise<boolean>;
  unAccept: () => Promise<boolean>;
};

export const TermsContext = React.createContext<TermsContextValue>({
  accepted: false,
  accept: () => Promise.resolve(false),
  unAccept: () => Promise.resolve(false),
});

export const GeneralTermsContextProvider: React.FC<{
  children?: React.ReactNode | null | undefined;
}> = ({ children }) => {
  const [accepted, setAccepted] = useState(true);

  const unAccept = useCallback(
    () =>
      setGeneralTermsNotAccepted()
        .then(() => {
          setAccepted(false);
          return true;
        })
        .catch(() => false),
    [],
  );

  const accept = useCallback(
    () =>
      setGeneralTermsLastVersionAccepted()
        .then(() => {
          setAccepted(true);
          return true;
        })
        .catch(() => false),
    [],
  );

  useEffect(() => {
    if (!acceptGeneralTermsAndUpdateStateRef.current)
      /**
       * Expose the accept method to the wild world so that the state of this
       * component can be updated from outside of the React scope.
       * */
      acceptGeneralTermsAndUpdateStateRef.current = accept;
    isAcceptedGeneralTerms().then(setAccepted);
    return () => {
      acceptGeneralTermsAndUpdateStateRef.current = null;
    };
  }, [accept]);

  const value = useMemo(
    () => ({ accepted, accept, unAccept }),
    [accept, accepted, unAccept],
  );

  return (
    <TermsContext.Provider value={value}>{children}</TermsContext.Provider>
  );
};

export function useLocalizedTermsUrl() {
  const { locale } = useLocale();

  return (urls.terms as Record<string, string>)[locale] || urls.terms.en;
}
