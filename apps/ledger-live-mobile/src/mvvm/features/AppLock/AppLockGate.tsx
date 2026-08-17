import {
  isAppLockConfigured,
  lockApp,
  selectAppLock,
  selectIsLocked,
} from "@features/platform-app-lock";
import React, { useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "~/context/hooks";
import { useAppLockHydration } from "./hooks/useAppLockHydration";
import { UnlockScreen } from "./screens/Unlock";

export function AppLockGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useDispatch();
  const isHydrated = useAppLockHydration();
  const protection = useSelector(selectAppLock);
  const isLocked = useSelector(selectIsLocked);
  const [hasDecidedInitialLock, setHasDecidedInitialLock] = useState(false);

  useEffect(() => {
    if (!isHydrated || hasDecidedInitialLock) {
      return;
    }

    if (isAppLockConfigured(protection)) {
      dispatch(lockApp());
    }

    setHasDecidedInitialLock(true);
  }, [dispatch, hasDecidedInitialLock, isHydrated, protection]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", nextState => {
      if (nextState !== "active" && isAppLockConfigured(protection)) {
        dispatch(lockApp());
      }
    });

    return () => subscription.remove();
  }, [dispatch, protection]);

  return (
    <>
      {children}
      {isLocked ? (
        <View style={styles.overlay}>
          <UnlockScreen />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
  },
});
