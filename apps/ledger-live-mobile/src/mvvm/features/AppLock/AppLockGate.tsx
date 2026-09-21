import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import {
  isAppBackgrounded,
  isAppLockConfigured,
  lockApp,
  selectAppLock,
  selectIsLocked,
} from "@features/platform-app-lock";
import React, { useCallback, useEffect, useState } from "react";
import { AppState, Platform, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "~/context/hooks";
import { useAppLockHydration } from "./hooks/useAppLockHydration";
import { useAppLockScheme } from "./hooks/useAppLockScheme";
import { UnlockScreen } from "./screens/Unlock";

export function AppLockGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useDispatch();
  useAppLockHydration();
  const scheme = useAppLockScheme();
  const isRevamped = scheme === "revamped";
  const protection = useSelector(selectAppLock);
  const isLocked = useSelector(selectIsLocked);
  const { dismissAll } = useBottomSheetModal();
  const [hasDecidedInitialLock, setHasDecidedInitialLock] = useState(false);

  const lockIfConfigured = useCallback(() => {
    if (isRevamped && isAppLockConfigured(protection)) {
      dispatch(lockApp());
    }
  }, [dispatch, isRevamped, protection]);

  useEffect(() => {
    if (scheme === undefined || hasDecidedInitialLock) {
      return;
    }

    lockIfConfigured();
    setHasDecidedInitialLock(true);
  }, [hasDecidedInitialLock, lockIfConfigured, scheme]);

  // A sheet the app left open sits in a host above this gate, so it would show through the lock.
  useEffect(() => {
    if (isLocked) {
      dismissAll();
    }
  }, [dismissAll, isLocked]);

  useEffect(() => {
    // Protection may have been enabled while the app was already backgrounded.
    if (!isLocked && isAppBackgrounded(AppState.currentState ?? "active", Platform.OS)) {
      lockIfConfigured();
    }

    const subscription = AppState.addEventListener("change", nextState => {
      if (isAppBackgrounded(nextState, Platform.OS)) {
        lockIfConfigured();
      }
    });

    return () => subscription.remove();
  }, [isLocked, lockIfConfigured]);

  // The initial state is unlocked, so anything rendered before the decision is reachable.
  if (scheme === undefined || !hasDecidedInitialLock) {
    return <View style={styles.cover} />;
  }

  return (
    <>
      <View
        style={styles.children}
        importantForAccessibility={isLocked ? "no-hide-descendants" : "auto"}
        accessibilityElementsHidden={isLocked}
      >
        {children}
      </View>
      {isLocked ? (
        <View style={styles.overlay} accessibilityViewIsModal>
          <UnlockScreen />
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  children: {
    flex: 1,
  },
  cover: {
    backgroundColor: "black",
    flex: 1,
  },
  // No zIndex: lifting the overlay paints the lock over the sheet the unlock screen raises.
  overlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
