import { useState, useCallback } from "react";
import { logDrawer } from "~/newArch/components/QueuedDrawer/utils/logDrawer";
import { useGetMembers } from "../../hooks/useGetMembers";
import { UseQueryResult } from "@tanstack/react-query";
import { MemberCredentials, TrustchainMember } from "@ledgerhq/trustchain/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { memberCredentialsSelector } from "@ledgerhq/trustchain/store";
import { useSelector } from "react-redux";

const messageLog = "Follow Steps on device";

export enum Scene {
  List,
  DeviceAction,
  Instructions,
  AutoRemove,
  Unsecured,
}

export type HookResult = {
  isDrawerVisible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  changeScene: (scene: Scene) => void;
  onClickInstance: (device: Device) => void;
  handleClose: () => void;
  onClickDelete: (scene: Scene) => void;
  memberHook: UseQueryResult<TrustchainMember[] | undefined, Error>;
  scene: Scene;
  device: Device | null;
  memberCredentials: MemberCredentials | null;
};

export const useManageInstancesDrawer = (): HookResult => {
  const memberHook = useGetMembers();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [scene, setScene] = useState(Scene.List);
  const [device, setDevice] = useState<Device | null>(null);
  const onClickDelete = (scene: Scene) => setScene(scene);

  const [isDrawerVisible, setIsDrawerInstructionsVisible] = useState(false);

  //const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const openDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(true);

    logDrawer(messageLog, "open");
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerInstructionsVisible(false);
    logDrawer(messageLog, "close");
  }, []);

  const onClickInstance = (device: Device) => {
    setScene(Scene.Instructions);
    setDevice(device);
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
    device,
    memberCredentials,
  };
};
