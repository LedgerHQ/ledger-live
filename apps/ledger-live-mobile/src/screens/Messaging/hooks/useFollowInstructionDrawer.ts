import { useNavigation } from "@react-navigation/native";
import { DependencyList, useCallback, useEffect, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { ScreenName } from "~/const";
import { useDestroyTrustchain } from "./useDestroyTrustchain";

export enum SceneKind {
  DeviceInstructions,
  Loader,
  ConfirmDeleteWrongSeedError,
  KeyError,
  UnbackedError,
  GenericError,
  AlreadySecuredSameSeed,
  AlreadySecuredOtherSeed,
}
type Scene =
  | { kind: SceneKind.DeviceInstructions; device: Device }
  | { kind: SceneKind.Loader }
  | { kind: SceneKind.ConfirmDeleteWrongSeedError }
  | { kind: SceneKind.KeyError }
  | { kind: SceneKind.AlreadySecuredSameSeed }
  | { kind: SceneKind.AlreadySecuredOtherSeed }
  | { kind: SceneKind.UnbackedError }
  | { kind: SceneKind.GenericError; error: Error };

export type DrawerProps = {
  scene: Scene;
  retry: () => void;
  goToDelete: () => void;
  backToWrongSeedError: () => void;
  confirmDeleteKey: () => void;
};

export function useFollowInstructionDrawer(
  run: (setScene: (scene: Scene) => void) => Promise<void>,
  deps: DependencyList = [],
): DrawerProps {
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const { deleteMutation } = useDestroyTrustchain();

  const [scene, setScene] = useState<Scene>({ kind: SceneKind.Loader });

  const retry = useCallback(async () => {
    setScene({ kind: SceneKind.Loader });
    await run(setScene);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goToDelete = useCallback(() => {
    setScene({ kind: SceneKind.ConfirmDeleteWrongSeedError });
  }, []);

  const backToWrongSeedError = useCallback(() => {
    setScene({ kind: SceneKind.AlreadySecuredOtherSeed });
  }, []);

  const confirmDeleteKey = useCallback(async () => {
    await deleteMutation.mutateAsync();
    navigation.navigate(ScreenName.WalletSyncManageKeyDeleteSuccess);
  }, [deleteMutation, navigation]);

  useEffect(() => {
    run(setScene);
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return { scene, retry, goToDelete, backToWrongSeedError, confirmDeleteKey };
}
