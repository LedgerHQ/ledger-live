import { useState, useCallback } from "react";
import { logDrawer } from "LLM/components/QueuedDrawer/utils/logDrawer";
import { useGetMembers } from "../../hooks/useGetMembers";
import { UseQueryResult } from "@tanstack/react-query";
import { MemberCredentials, TrustchainMember } from "@ledgerhq/ledger-key-ring-protocol/types";
import { memberCredentialsSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { AnalyticsButton, AnalyticsPage } from "../../hooks/useLedgerSyncAnalytics";

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
  memberHook: UseQueryResult<TrustchainMember[] | undefined, Error>;
  onClickInstance: (instance: TrustchainMember) => void;
  scene: Scene;
  memberCredentials: MemberCredentials | null;
  checkInstances: () => void;
};

export const useManageInstancesDrawer = (): HookResult => {
  const memberHook = useGetMembers();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [scene, setScene] = useState(Scene.List);
  const onClickDelete = (scene: Scene) => setScene(scene);

  const [isDrawerVisible, setIsDrawerInstructionsVisible] = useState(false);

  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

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

  const onClickInstance = (instance: TrustchainMember) => {
    track("button_clicked", {
      button: AnalyticsButton.RemoveInstance,
      page: AnalyticsPage.ManageSyncInstances,
    });
    navigation.navigate(ScreenName.WalletSyncManageInstancesProcess, {
      member: instance,
    });
  };

  const handleClose = () => {
    closeDrawer();
    setScene(Scene.List);
  };

  const changeScene = (scene: Scene) => setScene(scene);

  const checkInstances = () => memberHook.refetch();

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
    memberCredentials,
    checkInstances,
  };
};
