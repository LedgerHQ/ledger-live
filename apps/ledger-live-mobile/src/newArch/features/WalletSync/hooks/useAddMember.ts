import { memberCredentialsSelector, setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import { TrustchainNotAllowed } from "@ledgerhq/trustchain/errors";
import { TrustchainResult, TrustchainResultType } from "@ledgerhq/trustchain/types";
import { useCallback, useEffect, useRef } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { DrawerProps, SceneKind, useFollowInstructionDrawer } from "./useFollowInstructionDrawer";

export function useAddMember({ device }: { device: Device | null }): DrawerProps {
  const [DrawerProps, setScene] = useFollowInstructionDrawer();

  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const memberCredentialsRef = useRef(memberCredentials);
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const transitionToNextScreen = useCallback(
    (trustchainResult: TrustchainResult) => {
      dispatch(setTrustchain(trustchainResult.trustchain));
      navigation.navigate(ScreenName.WalletSyncLoading, {
        created: trustchainResult.type === TrustchainResultType.created,
      });
    },
    [dispatch, navigation],
  );

  useEffect(() => {
    const addMember = async () => {
      try {
        if (!device) return;
        if (!memberCredentialsRef.current) {
          throw new Error("memberCredentials is not set");
        }
        const trustchainResult = await sdk.getOrCreateTrustchain(
          device.deviceId,
          memberCredentialsRef.current,
          {
            onStartRequestUserInteraction: () =>
              setScene({ kind: SceneKind.DeviceInstructions, device }),
            onEndRequestUserInteraction: () => setScene({ kind: SceneKind.Loader }),
          },
        );
        if (trustchainResult) {
          transitionToNextScreen(trustchainResult);
        }
      } catch (error) {
        if (error instanceof TrustchainNotAllowed) {
          setScene({ kind: SceneKind.KeyError });
        } else if (error instanceof Error) {
          setScene({ kind: SceneKind.GenericError, error });
        }
      }
    };
    if (device && device.deviceId) {
      addMember();
    }
  }, [setScene, device, dispatch, sdk, transitionToNextScreen]);

  return DrawerProps;
}
