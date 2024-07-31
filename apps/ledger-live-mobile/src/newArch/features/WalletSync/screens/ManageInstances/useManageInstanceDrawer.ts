import { useState, useCallback } from "react";
import { logDrawer } from "~/newArch/components/QueuedDrawer/utils/logDrawer";
import { useGetMembers } from "../../hooks/useGetMembers";
import { UseQueryResult } from "@tanstack/react-query";
import { MemberCredentials, TrustchainMember } from "@ledgerhq/trustchain/types";
import { memberCredentialsSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";

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
  }, []);

  const onClickInstance = (instance: TrustchainMember) => {
    navigation.navigate(ScreenName.WalletSyncManageInstancesProcess, {
      member: instance,
    });
  };

  const handleClose = () => {
    closeDrawer();
    setScene(Scene.List);
  };

  const changeScene = (scene: Scene) => setScene(scene);

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
  };
};
