import React, { useEffect, useCallback } from "react";
import { StyleSheet, View, AppState } from "react-native";
import { connect } from "react-redux";
import { withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { compose } from "redux";
import { setPrivacy } from "~/actions/settings";
import { privacySelector } from "~/reducers/settings";
import { isPasswordLockBlocked } from "~/reducers/appstate";
import { SkipLockContext } from "~/components/behaviour/SkipLock";
import type { Privacy, State as GlobalState, AppState as EventState } from "~/reducers/types";
import AuthScreen from "./AuthScreen";
import RequestBiometricAuth from "~/components/RequestBiometricAuth";
import { useQueuedDrawerContext } from "LLM/components/QueuedDrawer/QueuedDrawersContext";
import { useAuthState, useAppStateHandler, usePrivacyInitialization } from "./auth.hooks";

const mapDispatchToProps = {
  setPrivacy,
};

const mapStateToProps = createStructuredSelector<
  GlobalState,
  {
    privacy: Privacy | null | undefined;
    isPasswordLockBlocked: EventState["isPasswordLockBlocked"]; // skips screen lock for internal deeplinks from ptx web player.
  }
>({
  privacy: privacySelector,
  isPasswordLockBlocked: isPasswordLockBlocked,
});

type OwnProps = {
  children: JSX.Element;
};

type Props = OwnProps & {
  privacy: Privacy | null | undefined;
  setPrivacy: (_: Privacy) => void;
  isPasswordLockBlocked: EventState["isPasswordLockBlocked"];
  closeAllDrawers: () => void;
};

const AuthPass: React.FC<Props> = ({
  privacy,
  setPrivacy,
  isPasswordLockBlocked,
  closeAllDrawers,
  children,
}) => {
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
  } = useAuthState({ privacy, closeAllDrawers });

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

export default compose<React.ComponentType<OwnProps>>(
  withTranslation(),
  connect(mapStateToProps, mapDispatchToProps),
  (Component: React.FC<{ closeAllDrawers(): void }>) => {
    return (props: Props) => {
      const { closeAllDrawers } = useQueuedDrawerContext();
      return <Component {...props} closeAllDrawers={closeAllDrawers} />;
    };
  },
)(AuthPass);
