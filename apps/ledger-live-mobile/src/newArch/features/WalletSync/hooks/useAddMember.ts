import { memberCredentialsSelector, setTrustchain } from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk, runWithDevice } from "./useTrustchainSdk";
import {
  MemberCredentials,
  TrustchainResult,
  TrustchainResultType,
} from "@ledgerhq/trustchain/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";

export function useAddMember({ device }: { device: Device | null }) {
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const [error, setError] = useState<Error | null>(null);

  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();

  const [userDeviceInteraction, setUserDeviceInteraction] = useState(false);

  const memberCredentialsRef = useRef(memberCredentials);

  const transitionToNextScreen = useCallback(
    (trustchainResult: TrustchainResult) => {
      dispatch(setTrustchain(trustchainResult.trustchain));
      navigation.navigate(ScreenName.WalletSyncSuccess, {
        created: trustchainResult.type === TrustchainResultType.created,
      });
    },
    [dispatch, navigation],
  );

  const onRetry = () => {};

  useEffect(() => {
    const addMember = async () => {
      try {
        await runWithDevice(device?.deviceId || "", async transport => {
          const trustchainResult = await sdk.getOrCreateTrustchain(
            transport,
            memberCredentialsRef.current as MemberCredentials,
            {
              onStartRequestUserInteraction: () => setUserDeviceInteraction(true),
              onEndRequestUserInteraction: () => setUserDeviceInteraction(false),
            },
          );
          if (trustchainResult) {
            transitionToNextScreen(trustchainResult);
          }
        });
      } catch (error) {
        setError(error as Error);
      }
    };
    if (device && device.deviceId) {
      addMember();
    }
  }, [device, dispatch, sdk, transitionToNextScreen]);

  return { error, userDeviceInteraction, onRetry };
}
