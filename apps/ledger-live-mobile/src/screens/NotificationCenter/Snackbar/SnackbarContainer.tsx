import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, FlatList, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import type { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { useSelector } from "react-redux";
import Snackbar from "./Snackbar";
import * as RootNavigation from "../../../rootnavigation";
import { NavigatorName, ScreenName } from "~/const";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";

export default function SnackbarContainer() {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { dismissToast, toasts } = useToasts();
  const { t } = useTranslation();
  const [nonce, setNonce] = useState(0);

  const navigate = useCallback(
    (toast: ToastData) => {
      if (toast.type === "announcement" || !toast.type) {
        toasts.forEach(({ id }) => dismissToast(id));
        RootNavigation.navigate(NavigatorName.NotificationCenter, {
          screen: ScreenName.NotificationCenter,
        });
      }
    },
    [dismissToast, toasts],
  );

  const handleDismissToast = useCallback(
    (toast: ToastData) => {
      dismissToast(toast.id);
    },
    [dismissToast],
  );

  const groupedSnackbarsItems = {
    id: uuid(),
    title: t("notificationCenter.groupedToast.text", {
      count: toasts?.length,
    }),
    icon: "info",
  };

  const lastToastIsSuccess = toasts && toasts[toasts.length - 1]?.type === "success";

  // Needed to force re-rendering of Snackbar when toasts is updated:
  // it was not re-render when a toast was removed on the Android version.
  // Also used to set a random zIndex.
  useEffect(() => {
    setNonce(prevNonce => prevNonce + 1);
  }, [toasts]);

  // Fixes a bug on Android: if zIndex was not updated to a new value
  // the next component using the same zIndex would not be displayed ...
  const randomZIndex = (nonce % 10) + 150;

  return hasCompletedOnboarding && toasts?.length ? (
    toasts.length === 1 ? (
      <FlatList
        style={{
          ...styles.root,
          zIndex: randomZIndex,
        }}
        data={[toasts[0]]} // NB in case we change our minds about the max
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Snackbar toast={item} onPress={navigate} onClose={handleDismissToast} />
        )}
      />
    ) : (
      <View
        style={{
          ...styles.root,
          zIndex: randomZIndex,
        }}
      >
        <Snackbar
          toast={lastToastIsSuccess ? toasts[toasts.length - 1] : groupedSnackbarsItems}
          cta={lastToastIsSuccess ? undefined : t("notificationCenter.groupedToast.cta")}
          onPress={navigate}
          onClose={lastToastIsSuccess ? handleDismissToast : undefined}
          key={nonce}
        />
      </View>
    )
  ) : null;
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 70 : 50,
    left: 0,
    height: "auto",
    width: "100%",
    zIndex: 150,
    elevation: 150,
    paddingHorizontal: 16,
  },
});
