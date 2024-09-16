import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/trustchain/store";
import { useDispatch, useSelector } from "react-redux";
import { useTrustchainSdk } from "./useTrustchainSdk";
import {
  NoTrustchainInitialized,
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
  TrustchainNotAllowed,
} from "@ledgerhq/trustchain/errors";
import { TrustchainResult, TrustchainResultType } from "@ledgerhq/trustchain/types";
import { useCallback, useRef } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { DrawerProps, SceneKind, useFollowInstructionDrawer } from "./useFollowInstructionDrawer";

export function useAddMember({ device }: { device: Device | null }): DrawerProps {
  const trustchain = useSelector(trustchainSelector);
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const memberCredentialsRef = useRef(memberCredentials);
  const trustchainRef = useRef(trustchain);
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const transitionToNextScreen = useCallback(
    (trustchainResult: TrustchainResult) => {
      dispatch(setTrustchain(trustchainResult.trustchain));
      navigation.navigate(ScreenName.WalletSyncLoading, {
        created: trustchainResult.type === TrustchainResultType.created,
      });
    },
    [dispatch, navigation],
  );

  return useFollowInstructionDrawer(
    async setScene => {
      try {
        if (!device) return;
        if (!memberCredentialsRef.current) {
          throw new Error("memberCredentials is not set");
        }
        const trustchainResult = await sdk.getOrCreateTrustchain(
          device.deviceId,
          memberCredentialsRef.current,
          {
            onInitialResponse: trustchains => {
              if (hasCompletedOnboarding || Object.keys(trustchains).length > 0) return;
              else throw new NoTrustchainInitialized();
            },
            onStartRequestUserInteraction: () =>
              setScene({ kind: SceneKind.DeviceInstructions, device }),
            onEndRequestUserInteraction: () => setScene({ kind: SceneKind.Loader }),
          },
          undefined,
          trustchainRef.current ?? undefined,
        );
        if (trustchainResult) {
          transitionToNextScreen(trustchainResult);
        }
      } catch (error) {
        if (error instanceof TrustchainNotAllowed) {
          setScene({ kind: SceneKind.KeyError });
        } else if (error instanceof TrustchainAlreadyInitialized) {
          setScene({ kind: SceneKind.AlreadySecuredSameSeed });
        } else if (error instanceof TrustchainAlreadyInitializedWithOtherSeed) {
          setScene({ kind: SceneKind.AlreadySecuredOtherSeed });
        } else if (error instanceof NoTrustchainInitialized) {
          setScene({ kind: SceneKind.UnbackedError });
        } else if (error instanceof Error) {
          setScene({ kind: SceneKind.GenericError, error });
        }
      }
    },
    [device, sdk, transitionToNextScreen, hasCompletedOnboarding],
  );
}
