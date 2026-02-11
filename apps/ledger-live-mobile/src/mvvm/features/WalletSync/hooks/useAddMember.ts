import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { useSelector, useDispatch } from "~/context/hooks";
import { useTrustchainSdk } from "./useTrustchainSdk";
import {
  NoTrustchainInitialized,
  TrustchainAlreadyInitialized,
  TrustchainAlreadyInitializedWithOtherSeed,
  TrustchainNotAllowed,
} from "@ledgerhq/ledger-key-ring-protocol/errors";
import { TrustchainResult, TrustchainResultType } from "@ledgerhq/ledger-key-ring-protocol/types";
import { useCallback, useRef } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation } from "@react-navigation/native";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { track } from "~/analytics";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import {
  hasCompletedOnboardingSelector,
  onboardingTypeSelector,
} from "~/reducers/settings";
import { DrawerProps, SceneKind, useFollowInstructionDrawer } from "./useFollowInstructionDrawer";
import { OnboardingType } from "~/reducers/types";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";

export function useAddMember({ device }: { device: Device | null }): DrawerProps {
  const trustchain = useSelector(trustchainSelector);
  const dispatch = useDispatch();
  const sdk = useTrustchainSdk();
  const memberCredentials = useSelector(memberCredentialsSelector);
  const memberCredentialsRef = useRef(memberCredentials);
  const trustchainRef = useRef(trustchain);
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);

  const transitionToNextScreen = useCallback(
    (trustchainResult: TrustchainResult) => {
      dispatch(setTrustchain(trustchainResult.trustchain));
      track(AnalyticsEvents.LedgerSyncActivated);
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
              if (
                onboardingType === OnboardingType.setupNew ||
                hasCompletedOnboarding ||
                Object.keys(trustchains).length > 0
              )
                return;
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
        if (error instanceof UserRefusedOnDevice || error instanceof TrustchainNotAllowed) {
          track(AnalyticsEvents.LedgerSyncRejectedOnDevice, {
            page: "Ledger Sync",
            modelId: device?.modelId,
            connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
          });
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
