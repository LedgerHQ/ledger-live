import { track } from "@shared/analytics";
import { useState, useCallback } from "react";
import type React from "react";
import { logDrawer } from "LLM/components/QueuedDrawer/utils/logDrawer";
import { useGetMembers } from "../../hooks/useGetMembers";
import type { LedgerSyncMembers } from "@features/platform-ledger-sync";
import {
  isCurrentKeyRingMember,
  selectKeyRingSession,
  type KeyRingMember,
  type KeyRingMemberId,
} from "@features/platform-key-ring";
import { useSelector } from "~/context/hooks";
import { useNavigation } from "@react-navigation/native";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { AnalyticsButton, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";
import { useManageInstancesDeviceIntentStep } from "./useManageInstancesDeviceIntentStep";

const messageLog = "Follow Steps on device";

export enum Scene {
  List,
  AutoRemove,
}

export type HookResult = {
  isDrawerVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  changeScene: (scene: Scene) => void;
  handleClose: () => void;
  onClickDelete: (scene: Scene) => void;
  memberHook: LedgerSyncMembers;
  onClickInstance: (instance: KeyRingMember) => void;
  scene: Scene;
  isCurrentInstance: (memberId: KeyRingMemberId) => boolean;
  checkInstances: () => void;
  /** Rendered by the screen outside the drawer: the step outlives it. */
  deviceIntentStepElement: React.ReactElement | null;
};

export function useManageInstancesDrawer(): HookResult {
  const memberHook = useGetMembers();
  const session = useSelector(selectKeyRingSession);
  const [scene, setScene] = useState(Scene.List);
  function onClickDelete(scene: Scene) {
    setScene(scene);
  }

  const [isDrawerVisible, setIsDrawerInstructionsVisible] = useState(false);

  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const deviceIntentStep = useManageInstancesDeviceIntentStep();

  const openDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(true);
    logDrawer(messageLog, "open");
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(false);
    logDrawer(messageLog, "close");

    track("button_clicked", {
      button: AnalyticsButton.Close,
      page: scene === Scene.List ? AnalyticsPage.ManageSyncInstances : AnalyticsPage.AutoRemove,
    });
  }, [scene]);

  function onClickInstance(instance: KeyRingMember) {
    track("button_clicked", {
      button: AnalyticsButton.RemoveInstance,
      page: AnalyticsPage.ManageSyncInstances,
    });
    if (deviceIntentStep.isEnabled) {
      setIsDrawerInstructionsVisible(false);
      deviceIntentStep.start({ member: instance });
      return;
    }
    navigation.navigate(ScreenName.WalletSyncManageInstancesProcess, {
      member: instance,
    });
  }

  function handleClose() {
    closeDrawer();
    setScene(Scene.List);
  }

  function changeScene(scene: Scene) {
    setScene(scene);
  }

  function checkInstances() {
    return memberHook.refetch();
  }

  function isCurrentInstance(memberId: KeyRingMemberId) {
    return isCurrentKeyRingMember(session, memberId);
  }

  return {
    isDrawerVisible,
    changeScene,
    openDrawer,
    closeDrawer,
    memberHook,
    onClickInstance,
    handleClose,
    onClickDelete,
    scene,
    isCurrentInstance,
    checkInstances,
    deviceIntentStepElement: deviceIntentStep.element,
  };
}
