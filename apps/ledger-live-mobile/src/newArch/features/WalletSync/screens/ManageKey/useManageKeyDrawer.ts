import { useNavigation } from "@react-navigation/native";
import { useState, useCallback } from "react";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { logDrawer } from "~/newArch/components/QueuedDrawer/utils/logDrawer";
import { useDestroyTrustchain } from "../../hooks/useDestroyTrustchain";
import { UseMutationResult } from "@tanstack/react-query";

const messageLog = "Follow Steps on device";

export enum Scene {
  Manage,
  Confirm,
}

export type HookResult = {
  isDrawerVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  handleClose: () => void;
  onClickDelete: () => void;
  scene: Scene;
  onClickConfirm: () => Promise<void>;
  deleteMutation: UseMutationResult<void, Error, void, unknown>;
};

export const useManageKeyDrawer = () => {
  const { deleteMutation } = useDestroyTrustchain();

  const [isDrawerVisible, setIsDrawerInstructionsVisible] = useState(false);

  const [scene, setScene] = useState(Scene.Manage);

  const onClickDelete = () => setScene(Scene.Confirm);

  const openDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(true);

    logDrawer(messageLog, "open");
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(false);
    logDrawer(messageLog, "close");
  }, []);

  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const handleClose = () => {
    closeDrawer();
    setScene(Scene.Manage);
  };

  const onClickConfirm = async () => {
    await deleteMutation.mutateAsync();
    closeDrawer();
    navigation.navigate(ScreenName.WalletSyncManageKeyDeleteSuccess);
  };

  return {
    isDrawerVisible,
    openDrawer,
    closeDrawer,
    handleClose,
    onClickDelete,
    scene,
    onClickConfirm,
    deleteMutation,
  };
};
