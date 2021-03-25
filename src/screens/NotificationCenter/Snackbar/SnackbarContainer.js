// @flow
import React, { useCallback } from "react";
import { StyleSheet, FlatList, Platform } from "react-native";

import { useToasts } from "@ledgerhq/live-common/lib/notifications/ToastProvider/index";
import type { ToastData } from "@ledgerhq/live-common/lib/notifications/ToastProvider/types";

import { useSelector } from "react-redux";
import Snackbar from "./Snackbar";
import * as RootNavigation from "../../../rootnavigation.js";
import { NavigatorName, ScreenName } from "../../../const";
import { hasCompletedOnboardingSelector } from "../../../reducers/settings";

export default function SnackbarContainer() {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { dismissToast, toasts } = useToasts();

  const navigate = useCallback(
    (toast: ToastData) => {
      if (toast.type === "announcement") {
        toasts.forEach(({ id }) => dismissToast(id));
        RootNavigation.navigate(NavigatorName.NotificationCenter, {
          screen: ScreenName.NotificationCenterNews,
        });
      }
    },
    [dismissToast, toasts],
  );

  const handleDismissToast = useCallback(
    (toast: ToastData) => dismissToast(toast.id),
    [dismissToast],
  );

  return hasCompletedOnboarding && toasts && toasts.length ? (
    <FlatList
      style={styles.root}
      data={toasts.slice(Math.max(0, toasts.length - 3))}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Snackbar
          toast={item}
          onPress={navigate}
          onClose={handleDismissToast}
        />
      )}
    />
  ) : null;
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 70 : 50,
    left: 0,
    height: "auto",
    width: "100%",
    zIndex: 100,
    paddingHorizontal: 16,
  },
});
