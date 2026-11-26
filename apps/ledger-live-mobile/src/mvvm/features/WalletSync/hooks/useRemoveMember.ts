import { useLedgerSyncMemberRemoval } from "@features/flow-ledger-sync";
import {
  assertKeyRingMember,
  isSameKeyRingMember,
  selectKeyRingSession,
  type KeyRingMember,
} from "@features/platform-key-ring";
import { selectIsKeyRingMember } from "@domain/entity-key-ring";
import { useSelector } from "~/context/hooks";
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
  const client = useKeyRingClient();
  const session = useSelector(selectKeyRingSession);
  const isMember = useSelector(selectIsKeyRingMember);
  const memberKeySession = useSelector(selectKeyRingSession, isSameKeyRingMember);
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const removeMember = useLedgerSyncMemberRemoval();

  const transitionToNextScreen = useCallback(
    (removedMember: KeyRingMember) => {
      navigation.navigate(ScreenName.WalletSyncManageInstancesSuccess, {
        member: removedMember,
      });
    },
    [navigation],
  );

  return useFollowInstructionDrawer(
    async setScene => {
      if (!member) return;
      if (!device) return;
      const outcome = await removeMember({
        client,
        session,
        member,
        legacyDeviceId: device.deviceId,
        callbacks: {
          onStartRequestUserInteraction: () =>
            setScene({ kind: SceneKind.DeviceInstructions, device }),
          onEndRequestUserInteraction: () => setScene({ kind: SceneKind.Loader }),
        },
        assertReady: () => assertKeyRingMember(session),
        onRemoved: () => transitionToNextScreen(member),
      });
      if (outcome.type === "done") return;

      if (outcome.reason === "not-allowed") {
        setScene({ kind: SceneKind.KeyError });
      } else if (outcome.error instanceof Error) {
        setScene({ kind: SceneKind.GenericError, error: outcome.error });
      }
    },
    [device, member, memberKeySession, client, transitionToNextScreen, !isMember],
  );
}
