import React, { useEffect, useCallback, useState } from "react";
import { StyleSheet, View, AppState } from "react-native";
import { useDispatch, useSelector } from "~/context/store";
import { privacySelector } from "~/reducers/settings";
import { setPrivacy as setPrivacyAction } from "~/actions/settings";
import { isPasswordLockBlocked as isPasswordLockBlockedState } from "~/reducers/appstate";
import { SkipLockContext } from "~/components/behaviour/SkipLock";
import type { Privacy } from "~/reducers/types";
import AuthScreen from "./AuthScreen";
import RequestBiometricAuth from "~/components/RequestBiometricAuth";
import { useQueuedDrawerContext } from "LLM/components/QueuedDrawer/QueuedDrawersContext";
import { useAppStateHandler, usePrivacyInitialization } from "./auth.hooks";
import { isLockedSelector, biometricsErrorSelector, authModalOpenSelector } from "~/reducers/auth";
import {
  initializeAuthState,
  setLocked,
  setBiometricsError,
  setAuthModalOpen,
  lock as lockAction,
  unlock as unlockAction,
} from "~/actions/auth";

type OwnProps = {
  children: React.JSX.Element;
};

const AuthPass: React.FC<OwnProps> = ({ children }) => {
  const [skipLockCount, setSkipLockCount] = useState(0);

  const dispatch = useDispatch();

  const privacy = useSelector(privacySelector);
  const authModalOpen = useSelector(authModalOpenSelector);
  const isLocked = useSelector(isLockedSelector);
  const isPasswordLockBlocked = useSelector(isPasswordLockBlockedState);
  const biometricsError = useSelector(biometricsErrorSelector);

  const setPrivacy = useCallback(
    (privacy: Privacy) => {
      dispatch(setPrivacyAction(privacy));
    },
    [dispatch],
  );

  const { closeAllDrawers } = useQueuedDrawerContext();

  const lock = useCallback(() => {
    if (!privacy?.hasPassword || skipLockCount) return;

    closeAllDrawers();

    dispatch(lockAction());
  }, [privacy, skipLockCount, closeAllDrawers, dispatch]);

  const unlock = useCallback(() => {
    dispatch(unlockAction());
  }, [dispatch]);

  const { handleAppStateChange } = useAppStateHandler({ isPasswordLockBlocked, lock });

  const initializePrivacy = usePrivacyInitialization({ privacy, setPrivacy });

  const setEnabled = useCallback(
    (enabled: boolean) => {
      setSkipLockCount(prevCount => prevCount + (enabled ? 1 : -1));
    },
    [setSkipLockCount],
  );

  // auth: try to auth with biometrics and fallback on password
  const auth = useCallback(() => {
    const biometricModal = isLocked && !!privacy?.biometricsEnabled;
    dispatch(setAuthModalOpen(biometricModal));
  }, [isLocked, privacy?.biometricsEnabled, dispatch]);

  const setupComponent = useCallback(() => {
    auth();

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    initializePrivacy();

    return () => {
      subscription.remove();
    };
  }, [auth, handleAppStateChange, initializePrivacy]);

  const handlePasswordStateChange = useCallback(() => {
    if (isLocked && !privacy?.hasPassword) {
      dispatch(setLocked(false));
    }
  }, [isLocked, privacy?.hasPassword, dispatch]);

  useEffect(setupComponent, [setupComponent]);
  useEffect(handlePasswordStateChange, [handlePasswordStateChange]);

  useEffect(() => {
    if (isLocked && privacy?.hasPassword) {
      dispatch(initializeAuthState({ privacy }));
    }
  }, [dispatch, isLocked, privacy]);

  const onSuccess = useCallback(() => {
    dispatch(setAuthModalOpen(false));

    dispatch(unlockAction());
  }, [dispatch]);

  const onError = useCallback(
    (error: Error) => {
      dispatch(setAuthModalOpen(false));
      dispatch(setBiometricsError(error));
    },
    [dispatch],
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
