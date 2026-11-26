import { track } from "@shared/analytics";
import {
  classifyKeyRingError,
  commitKeyRingTree,
  selectKeyRingSession,
  type KeyRingActivation,
} from "@features/platform-key-ring";
import { selectHasKeyRingMemberKey } from "@domain/entity-key-ring";
import { useSelector, useDispatch } from "~/context/hooks";
import { useKeyRingClient } from "./useKeyRingClient";
import { useCallback, useRef } from "react";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { AnalyticsEvents } from "LLM/features/WalletSync/Analytics/enums";
import { useWalletSyncTrackingFlow } from "./useLedgerSyncAnalytics";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { hasCompletedOnboardingSelector, onboardingTypeSelector } from "~/reducers/settings";
import { DrawerProps, SceneKind, useFollowInstructionDrawer } from "./useFollowInstructionDrawer";
import { OnboardingType } from "~/reducers/types";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";

export function useAddMember({ device }: { device: Device | null }): DrawerProps {
  const session = useSelector(selectKeyRingSession);
  const dispatch = useDispatch();
  const client = useKeyRingClient();
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const hasMemberKeyRef = useRef(hasMemberKey);
  const sessionRef = useRef(session);
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const { params } =
    useRoute<
      RouteProp<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
    >();
  const seededOffer = params?.seededOffer === true;
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);
  const trackingFlow = useWalletSyncTrackingFlow();

  const transitionToNextScreen = useCallback(
    (activation: KeyRingActivation) => {
      dispatch(commitKeyRingTree(activation.tree));
      track(AnalyticsEvents.LedgerSyncActivated, { flow: trackingFlow });
      if (seededOffer) {
        navigation.getParent()?.goBack();
        return;
      }
      navigation.navigate(ScreenName.WalletSyncLoading, {
        created: activation.outcome === "created",
      });
    },
    [dispatch, navigation, seededOffer, trackingFlow],
  );

  return useFollowInstructionDrawer(
    async setScene => {
      try {
        if (!device) return;
        if (!hasMemberKeyRef.current) {
          throw new Error("memberCredentials is not set");
        }
        const activation = await client.activate(sessionRef.current, {
          legacyDeviceId: device.deviceId,
          callbacks: {
            onStartRequestUserInteraction: () =>
              setScene({ kind: SceneKind.DeviceInstructions, device }),
            onEndRequestUserInteraction: () => setScene({ kind: SceneKind.Loader }),
          },
          allowTreeCreation: onboardingType === OnboardingType.setupNew || hasCompletedOnboarding,
        });
        if (activation) {
          transitionToNextScreen(activation);
        }
      } catch (error) {
        const category = classifyKeyRingError(error);
        if (category === "not-allowed") {
          setScene({ kind: SceneKind.KeyError });
        } else if (category === "already-member") {
          setScene({ kind: SceneKind.AlreadySecuredSameSeed });
        } else if (category === "member-of-other-tree") {
          setScene({ kind: SceneKind.AlreadySecuredOtherSeed });
        } else if (category === "no-tree-for-seed") {
          setScene({ kind: SceneKind.UnbackedError });
        } else if (error instanceof Error) {
          if (category === "user-refused") {
            track(AnalyticsEvents.LedgerSyncRejectedOnDevice, {
              page: "Ledger Sync",
              modelId: device?.modelId,
              connectionType: device?.wired ? CONNECTION_TYPES.USB : CONNECTION_TYPES.BLE,
            });
          }
          setScene({ kind: SceneKind.GenericError, error });
        }
      }
    },
    [device, client, transitionToNextScreen, hasCompletedOnboarding],
  );
}
