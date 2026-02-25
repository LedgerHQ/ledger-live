import React, { useCallback, useMemo } from "react";
import { useTheme } from "styled-components/native";
import { useSelector } from "~/context/hooks";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalletFeaturesConfig, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useManagerNavLockCallback } from "../CustomBlockRouterNavigator";
import { hasOrderedNanoSelector, readOnlyModeEnabledSelector } from "~/reducers/settings";
import { isMainNavigatorVisibleSelector } from "~/reducers/appstate";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { useRebornFlow } from "LLM/features/Reborn/hooks/useRebornFlow";
import { useTransferDrawerController } from "LLM/features/QuickActions";
import { useTabBar } from "./useTabBar";
import { useScreenOptions } from "./useScreenOptions";
import { Wallet40TabNavigator } from "./Wallet40TabNavigator";
import { LegacyTabNavigator } from "./LegacyTabNavigator";

export default function MainNavigator() {
  const { colors } = useTheme();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const isMainNavigatorVisible = useSelector(isMainNavigatorVisibleSelector);
  const managerNavLockCallback = useManagerNavLockCallback();
  const web3hub = useFeature("web3hub");
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("mobile");
  const earnYieldLabel = getStakeLabelLocaleBased();
  const { navigateToRebornFlow } = useRebornFlow();
  const { openDrawer: openTransferDrawer } = useTransferDrawerController();
  const insets = useSafeAreaInsets();

  const tabBar = useTabBar({
    shouldDisplayWallet40MainNav,
    isMainNavigatorVisible,
    colors,
    insets,
  });

  const screenOptions = useScreenOptions({
    colors,
    shouldDisplayWallet40MainNav,
  });

  const managerLockAwareCallback = useCallback(
    (callback: () => void) => {
      if (managerNavLockCallback) {
        managerNavLockCallback(() => callback());
      } else {
        callback();
      }
    },
    [managerNavLockCallback],
  );

  const rebornFlowListener = useMemo(() => {
    if (!readOnlyModeEnabled) {
      return (_: { preventDefault: () => void }) => {};
    }
    return (e: { preventDefault: () => void }) => {
      e.preventDefault();
      managerLockAwareCallback(navigateToRebornFlow);
    };
  }, [readOnlyModeEnabled, navigateToRebornFlow, managerLockAwareCallback]);

  if (shouldDisplayWallet40MainNav) {
    return (
      <Wallet40TabNavigator
        tabBar={tabBar}
        screenOptions={screenOptions}
        rebornFlowListener={rebornFlowListener}
      />
    );
  }

  return (
    <LegacyTabNavigator
      tabBar={tabBar}
      screenOptions={screenOptions}
      managerLockAwareCallback={managerLockAwareCallback}
      readOnlyModeEnabled={readOnlyModeEnabled}
      hasOrderedNano={hasOrderedNano}
      navigateToRebornFlow={navigateToRebornFlow}
      openTransferDrawer={openTransferDrawer}
      web3hubEnabled={!!web3hub?.enabled}
      earnYieldLabel={earnYieldLabel}
    />
  );
}
