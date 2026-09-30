import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import {
  decideLaunchLock,
  isAppLockConfigured,
  lockApp,
  selectAppLock,
  selectHasDecidedLaunchLock,
  selectIsLocked,
} from "@features/platform-app-lock";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import Config from "react-native-config";
import { useDispatch, useSelector } from "~/context/hooks";
import { isAppInBackground, onAppBackground, onAppForeground } from "./adapters/appVisibility";
import { useAppLockHydration } from "./hooks/useAppLockHydration";
import { useAppLockScheme } from "./hooks/useAppLockScheme";
import { useLegacyPasswordMigration } from "./hooks/useLegacyPasswordMigration";
import { LongerPasswordGate } from "./LongerPasswordGate";
import { useLongerPasswordGateViewModel } from "./LongerPasswordGate/useLongerPasswordGateViewModel";
import { UnlockScreen } from "./screens/Unlock";

const LOCK_GRACE_MS = Config.DETOX ? 1_000 : 15_000;

export function AppLockGate({ children }: Readonly<{ children: React.ReactNode }>) {
  const dispatch = useDispatch();
  useAppLockHydration();
  useLegacyPasswordMigration();
  const scheme = useAppLockScheme();
  const isRevamped = scheme === "revamped";
  const protection = useSelector(selectAppLock);
  const isLocked = useSelector(selectIsLocked);
  const { dismissAll } = useBottomSheetModal();
  const longerPassword = useLongerPasswordGateViewModel();
  const hasDecidedLaunchLock = useSelector(selectHasDecidedLaunchLock);
  const leftAtRef = useRef<number | null>(null);
  const [isAway, setIsAway] = useState(false);

  const lockIfConfigured = useCallback(() => {
    if (isRevamped && isAppLockConfigured(protection)) {
      dispatch(lockApp());
    }
  }, [dispatch, isRevamped, protection]);

  useEffect(() => {
    if (scheme === undefined || hasDecidedLaunchLock) {
      return;
    }

    lockIfConfigured();
    dispatch(decideLaunchLock());
  }, [dispatch, hasDecidedLaunchLock, lockIfConfigured, scheme]);

  // A sheet the app left open sits in a host above this gate, so it would show through the lock.
  useEffect(() => {
    if (isLocked) {
      dismissAll();
    }
  }, [dismissAll, isLocked]);

  const leave = useCallback(() => {
    leftAtRef.current ??= Date.now();
    setIsAway(true);
  }, []);

  const comeBack = useCallback(() => {
    const leftAt = leftAtRef.current;
    leftAtRef.current = null;
    setIsAway(false);

    if (leftAt !== null && Date.now() - leftAt >= LOCK_GRACE_MS) {
      lockIfConfigured();
    }
  }, [lockIfConfigured]);

  useEffect(() => {
    // Protection may have been enabled while the app was already backgrounded.
    if (!isLocked && isAppInBackground()) {
      leftAtRef.current ??= Date.now();
    }

    const stopLeaving = onAppBackground(leave);
    const stopComingBack = onAppForeground(comeBack);

    return () => {
      stopLeaving();
      stopComingBack();
    };
  }, [comeBack, isLocked, leave]);

  // The initial state is unlocked, so anything rendered before the decision is reachable.
  if (scheme === undefined || !hasDecidedLaunchLock) {
    return <View style={styles.cover} />;
  }

  // `accessibilityViewIsModal` hides nothing from TalkBack, so whatever covers the app has to take
  // the screen reader with it, or a mandatory prompt can be reached around.
  const isHidden = isAway && isRevamped && isAppLockConfigured(protection);
  const isCovered = isLocked || isHidden || longerPassword.isHolding;

  return (
    <>
      <View
        style={styles.children}
        importantForAccessibility={isCovered ? "no-hide-descendants" : "auto"}
        accessibilityElementsHidden={isCovered}
      >
        {children}
      </View>
      <LongerPasswordGate {...longerPassword} />
      {isHidden && !isLocked ? <View style={[styles.cover, styles.overlay]} /> : null}
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
