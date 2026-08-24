import {
  isAppBackgrounded,
  isAppLockConfigured,
  lockApp,
  selectAppLock,
  selectIsAppLockBlocking,
  selectIsLocked,
  selectNeedsLongerPassword,
} from "@features/platform-app-lock";
import React, { useCallback, useEffect, useState } from "react";
import { AppState, BackHandler, Platform } from "react-native";
import StyleProvider from "~/StyleProvider";
import { useDispatch, useSelector } from "~/context/hooks";
import { AppLockOverlayHost } from "./components/AppLockOverlayHost";
import { useAppLockBootstrap } from "./hooks/useAppLockBootstrap";
import { useLegacyPasswordMigration } from "./hooks/useLegacyPasswordMigration";
import { LongerPasswordScreen } from "./screens/LongerPassword";
import { UnlockScreen } from "./screens/Unlock";

export function AppLockGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useDispatch();
  const isReady = useAppLockBootstrap();

  useLegacyPasswordMigration();
  const protection = useSelector(selectAppLock);
  const isLocked = useSelector(selectIsLocked);
  const needsLongerPassword = useSelector(selectNeedsLongerPassword);
  const isBlocking = useSelector(selectIsAppLockBlocking);
  const [hasDecidedInitialLock, setHasDecidedInitialLock] = useState(false);
  const [isLongerPasswordFlowOpen, setIsLongerPasswordFlowOpen] = useState(false);
  const closeLongerPasswordFlow = useCallback(() => setIsLongerPasswordFlowOpen(false), []);

  useEffect(() => {
    if (needsLongerPassword) {
      setIsLongerPasswordFlowOpen(true);
    }
  }, [needsLongerPassword]);

  useEffect(() => {
    if (!isReady || hasDecidedInitialLock) {
      return;
    }

    if (isAppLockConfigured(protection)) {
      dispatch(lockApp());
    }

    setHasDecidedInitialLock(true);
  }, [dispatch, hasDecidedInitialLock, isReady, protection]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState => {
      if (isAppBackgrounded(nextState, Platform.OS) && isAppLockConfigured(protection)) {
        dispatch(lockApp());
      }
    });

    return () => subscription.remove();
  }, [dispatch, protection]);

  useEffect(() => {
    if (!isBlocking) {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);

    return () => subscription.remove();
  }, [isBlocking]);

  return (
    <>
      {children}
      {isLocked ? (
        <StyleProvider selectedPalette="dark">
          <AppLockOverlayHost>
            <UnlockScreen />
          </AppLockOverlayHost>
        </StyleProvider>
      ) : null}
      {!isLocked && isLongerPasswordFlowOpen ? (
        <AppLockOverlayHost>
          <LongerPasswordScreen onDone={closeLongerPasswordFlow} />
        </AppLockOverlayHost>
      ) : null}
    </>
  );
}
