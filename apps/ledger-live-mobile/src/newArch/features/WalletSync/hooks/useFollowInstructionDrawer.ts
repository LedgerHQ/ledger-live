import { useNavigation } from "@react-navigation/native";
import { Dispatch, SetStateAction, useCallback, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { useDestroyTrustchain } from "./useDestroyTrustchain";

export enum SceneKind {
  DeviceInstructions,
  Loader,
  WrongSeedError,
  KeyError,
  GenericError,
  AlreadySecuredSameSeed,
  AlreadySecuredOtherSeed,
}
type Scene =
  | { kind: SceneKind.DeviceInstructions; device: Device }
  | { kind: SceneKind.Loader }
  | { kind: SceneKind.WrongSeedError }
  | { kind: SceneKind.KeyError }
  | { kind: SceneKind.AlreadySecuredSameSeed }
  | { kind: SceneKind.AlreadySecuredOtherSeed }
  | { kind: SceneKind.GenericError; error: Error };

export type DrawerProps = {
  scene: Scene;
  onRetry: () => void;
  goToDelete: () => void;
  backToKeyError: () => void;
  confirmDeleteKey: () => void;
};

export function useFollowInstructionDrawer(): [DrawerProps, Dispatch<SetStateAction<Scene>>] {
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const { deleteMutation } = useDestroyTrustchain();

  const [scene, setScene] = useState<Scene>({ kind: SceneKind.Loader });

  // eslint-disable-next-line no-console
  const onRetry = useCallback(() => console.log("onRetry"), []);

  const goToDelete = useCallback(() => {
    setScene({ kind: SceneKind.WrongSeedError });
  }, []);

  const backToKeyError = useCallback(() => {
    setScene({ kind: SceneKind.KeyError });
  }, []);

  const confirmDeleteKey = useCallback(async () => {
    await deleteMutation.mutateAsync();
    navigation.navigate(ScreenName.WalletSyncManageKeyDeleteSuccess);
  }, [deleteMutation, navigation]);

  return [{ scene, onRetry, goToDelete, backToKeyError, confirmDeleteKey }, setScene];
}
