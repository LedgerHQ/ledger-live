import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import { TrustchainMember, Trustchain } from "@ledgerhq/trustchain/types";
import { useCallback, useEffect, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";

type Props = {
  device: Device | null;
  member: TrustchainMember | null;
};

export function useRemoveMember({ device, member }: Props) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [error, setError] = useState<Error | null>(null);

  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  // eslint-disable-next-line no-console
  const onRetry = useCallback(() => console.log("onRetry"), []);
  // () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.DeviceActionInstance })),

  const goToDelete = useCallback(
    () => navigation.navigate(ScreenName.WalletSyncActivated),
    [navigation],
  );

  // eslint-disable-next-line no-console
  const onResetFlow = useCallback(() => console.log("onResetFlow"), []);
  //  () => dispatch(setFlow({ flow: Flow.ManageInstances, step: Step.SynchronizedInstances })),

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

  const removeMember = useCallback(
    async (member: TrustchainMember) => {
      if (!device) return;
      if (!trustchain || !memberCredentials) {
        throw new Error("trustchain or memberCredentials is not set");
      }
      try {
        await runWithDevice(device.deviceId, async transport => {
          const newTrustchain = await sdk.removeMember(
            transport,
            trustchain,
            memberCredentials,
            member,
            {
              onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
              onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
            },
          );

          transitionToNextScreen(newTrustchain);
        });
      } catch (error) {
        if (error instanceof Error) setError(error);
      }
    },
    [device, memberCredentials, sdk, transitionToNextScreen, trustchain],
  );

  useEffect(() => {
    if (device && device.deviceId) {
      if (!member) {
        onResetFlow();
      } else {
        removeMember(member);
      }
    }
  }, [device, member, onResetFlow, onRetry, removeMember]);

  return {
    error,
    onRetry,
    userDeviceInteraction,
    goToDelete,
  };
}
