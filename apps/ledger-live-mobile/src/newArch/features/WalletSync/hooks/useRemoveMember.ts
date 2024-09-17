import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { TrustchainNotAllowed } from "@ledgerhq/trustchain/errors";
import { TrustchainMember, Trustchain } from "@ledgerhq/trustchain/types";
import { useCallback } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { DrawerProps, SceneKind, useFollowInstructionDrawer } from "./useFollowInstructionDrawer";

type Props = {
  device: Device | null;
  member: TrustchainMember | null;
};

export function useRemoveMember({ device, member }: Props): DrawerProps {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const transitionToNextScreen = useCallback(
    (trustchainResult: Trustchain) => {
      if (!member) return;
      dispatch(setTrustchain(trustchainResult));
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
        if (!trustchain || !memberCredentials) {
          throw new Error("trustchain or memberCredentials is not set");
        }
        const newTrustchain = await sdk.removeMember(
          device.deviceId,
          trustchain,
          memberCredentials,
          member,
          {
            onStartRequestUserInteraction: () =>
              setScene({ kind: SceneKind.DeviceInstructions, device }),
            onEndRequestUserInteraction: () => setScene({ kind: SceneKind.Loader }),
          },
        );

        transitionToNextScreen(newTrustchain);
      } catch (error) {
        if (error instanceof TrustchainNotAllowed) {
          setScene({ kind: SceneKind.KeyError });
        } else if (error instanceof Error) {
          setScene({ kind: SceneKind.GenericError, error });
        }
      }
    },
    [device, member, memberCredentials, sdk, transitionToNextScreen, !trustchain],
  );
}
