import React, { useCallback } from "react";
import { View, StyleSheet, FlatList, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { v4 as uuid } from "uuid";
import { useToasts } from "@ledgerhq/live-common/notifications/ToastProvider/index";
import type { ToastData } from "@ledgerhq/live-common/notifications/ToastProvider/types";
import { useSelector } from "react-redux";
import Snackbar from "./Snackbar";
import * as RootNavigation from "../../../rootnavigation";
import { NavigatorName, ScreenName } from "../../../const";
import { hasCompletedOnboardingSelector } from "../../../reducers/settings";

export default function SnackbarContainer() {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { dismissToast, toasts } = useToasts();
  const { t } = useTranslation();
  const navigate = useCallback(
    (toast: ToastData) => {
      if (toast.type === "announcement" || !toast.type) {
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
  const groupedSnackbarsItems = {
    id: uuid(),
    title: t("notificationCenter.groupedToast.text", {
      count: toasts?.length,
    }),
    icon: "info",
  };
  return hasCompletedOnboarding &&
    toasts &&
    toasts.length &&
    toasts.length === 1 ? (
    <FlatList
      style={styles.root}
      data={[toasts[0]]} // NB in case we change our minds about the max
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <Snackbar
          toast={item}
          onPress={navigate}
          onClose={handleDismissToast}
        />
      )}
    />
  ) : toasts.length && toasts.length > 1 ? (
    <View style={styles.root}>
      <Snackbar
        toast={groupedSnackbarsItems}
        cta={t("notificationCenter.groupedToast.cta")}
        onPress={navigate}
      />
    </View>
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
