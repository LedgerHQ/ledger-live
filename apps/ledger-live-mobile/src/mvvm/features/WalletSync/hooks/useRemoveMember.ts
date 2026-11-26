import {
  assertKeyRingMember,
  classifyKeyRingError,
  commitKeyRingTree,
  isSameKeyRingMember,
  selectKeyRingSession,
  type KeyRingMember,
  type KeyRingTreeUpdate,
} from "@features/platform-key-ring";
import { selectIsKeyRingMember } from "@domain/entity-key-ring";
import { useSelector, useDispatch } from "~/context/hooks";
import { useKeyRingClient } from "./useKeyRingClient";
import { useCallback } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { DrawerProps, SceneKind, useFollowInstructionDrawer } from "./useFollowInstructionDrawer";

type Props = {
  device: Device | null;
  member: KeyRingMember | null;
};

export function useRemoveMember({ device, member }: Props): DrawerProps {
  const dispatch = useDispatch();
  const client = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);
  const isMember = useSelector(selectIsKeyRingMember);
  const memberKeySession = useSelector(selectKeyRingSession, isSameKeyRingMember);
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const transitionToNextScreen = useCallback(
    (newTree: KeyRingTreeUpdate) => {
      if (!member) return;
      dispatch(commitKeyRingTree(newTree));
      navigation.navigate(ScreenName.WalletSyncManageInstancesSuccess, {
        member,
      });
    },
    [dispatch, member, navigation],
  );

  return useFollowInstructionDrawer(
    async setScene => {
      try {
        if (!member) return;
        if (!device) return;
        assertKeyRingMember(session);
        const newTree = await client.removeMember(session, {
          legacyDeviceId: device.deviceId,
          member,
          callbacks: {
            onStartRequestUserInteraction: () =>
              setScene({ kind: SceneKind.DeviceInstructions, device }),
            onEndRequestUserInteraction: () => setScene({ kind: SceneKind.Loader }),
          },
        });

        transitionToNextScreen(newTree);
      } catch (error) {
        if (classifyKeyRingError(error) === "not-allowed") {
          setScene({ kind: SceneKind.KeyError });
        } else if (error instanceof Error) {
          setScene({ kind: SceneKind.GenericError, error });
        }
      }
    },
    [device, member, memberKeySession, client, transitionToNextScreen, !isMember],
  );
}
