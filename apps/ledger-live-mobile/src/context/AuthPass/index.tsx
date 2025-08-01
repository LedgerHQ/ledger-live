import React, { useEffect, useCallback } from "react";
import { StyleSheet, View, AppState } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { privacySelector } from "~/reducers/settings";
import { setPrivacy as setPrivacyAction } from "~/actions/settings";
import { isPasswordLockBlocked as isPasswordLockBlockedState } from "~/reducers/appstate";
import { SkipLockContext } from "~/components/behaviour/SkipLock";
import type { Privacy } from "~/reducers/types";
import AuthScreen from "./AuthScreen";
import RequestBiometricAuth from "~/components/RequestBiometricAuth";
import { useQueuedDrawerContext } from "LLM/components/QueuedDrawer/QueuedDrawersContext";
import { useAuthState, useAppStateHandler, usePrivacyInitialization } from "./auth.hooks";

type OwnProps = {
  children: JSX.Element;
};

const AuthPass: React.FC<OwnProps> = ({ children }) => {
  const dispatch = useDispatch();

  const privacy = useSelector(privacySelector);
  const setPrivacy = useCallback(
    (privacy: Privacy) => {
      dispatch(setPrivacyAction(privacy));
    },
    [dispatch],
  );

  const isPasswordLockBlocked = useSelector(isPasswordLockBlockedState);
  const { closeAllDrawers } = useQueuedDrawerContext();

  const {
    isLocked,
    biometricsError,
    authModalOpen,
    mounted,
    setIsLocked,
    setBiometricsError,
    setAuthModalOpen,
    setSkipLockCount,
    lock,
    unlock,
  } = useAuthState({ closeAllDrawers });

  const { handleAppStateChange } = useAppStateHandler({ isPasswordLockBlocked, lock });

  const initializePrivacy = usePrivacyInitialization({ privacy, setPrivacy });

  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (mounted.current) {
        setSkipLockCount(prevCount => prevCount + (enabled ? 1 : -1));
      }
    },
    [mounted, setSkipLockCount],
  );

  // auth: try to auth with biometrics and fallback on password
  const auth = useCallback(() => {
    if (isLocked && privacy?.biometricsEnabled && !authModalOpen && mounted.current) {
      setAuthModalOpen(true);
    }
  }, [isLocked, privacy, authModalOpen, mounted, setAuthModalOpen]);

  const setupComponent = useCallback(() => {
    mounted.current = true;
    auth();

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    initializePrivacy();

    return () => {
      mounted.current = false;
      subscription.remove();
    };
  }, [auth, handleAppStateChange, initializePrivacy, mounted]);

  const handlePasswordStateChange = useCallback(() => {
    if (isLocked && !privacy?.hasPassword) {
      setIsLocked(false);
    }
  }, [isLocked, privacy?.hasPassword, setIsLocked]);

  useEffect(setupComponent, [setupComponent]);
  useEffect(handlePasswordStateChange, [handlePasswordStateChange]);

  const onSuccess = useCallback(() => {
    if (mounted.current) {
      setAuthModalOpen(false);
    }
    unlock();
  }, [unlock, mounted, setAuthModalOpen]);

  const onError = useCallback(
    (error: Error) => {
      if (mounted.current) {
        setAuthModalOpen(false);
        setBiometricsError(error);
      }
    },
    [mounted, setAuthModalOpen, setBiometricsError],
  );

  let lockScreen = null;

  if (isLocked && privacy?.hasPassword) {
    lockScreen = (
      <View style={styles.container}>
        <AuthScreen
          biometricsError={biometricsError}
          privacy={privacy}
          lock={lock}
          unlock={unlock}
        />
        <RequestBiometricAuth disabled={!authModalOpen} onSuccess={onSuccess} onError={onError} />
      </View>
    );
  }

  return (
    <SkipLockContext.Provider value={setEnabled}>
      {children}
      {lockScreen}
    </SkipLockContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
});

export default AuthPass;
