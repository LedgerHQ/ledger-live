import { useCallback } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { track } from "@shared/analytics";
import { createIntent, type DeviceConnectionResult } from "@features/platform-device-intent";
import type { AddMemberIntent, AddMemberIntentInput } from "@features/platform-intent-wallet-sync";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { NoTrustchainInitialized } from "@ledgerhq/ledger-key-ring-protocol/errors";
import {
  type GetOrCreateTrustchainCallbacks,
  type TrustchainResult,
  TrustchainResultType,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector } from "~/context/hooks";
import { WalletSyncNavigatorStackParamList } from "~/components/RootNavigator/types/WalletSyncNavigator";
import { StackNavigatorNavigation } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import { hasCompletedOnboardingSelector, onboardingTypeSelector } from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";
import { AnalyticsEvents } from "../../Analytics/enums";
import { useWalletSyncTrackingFlow } from "../../hooks/useLedgerSyncAnalytics";
import { addMemberIntentLWMDefinition } from "../../deviceIntents/addMemberIntent/intentLWMDefinition";
import { useCreateSessionSdk } from "../../deviceIntents/useCreateSessionSdk";
import { useLedgerSyncIntentStep } from "../../deviceIntents/useLedgerSyncIntentStep";

/** The add member step of the activation on DIE, with the outcomes of `useAddMember`. */
export function useActivationDeviceIntentStepViewModel() {
  const dispatch = useDispatch();
  const navigation = useNavigation<StackNavigatorNavigation<WalletSyncNavigatorStackParamList>>();
  const { params } =
    useRoute<
      RouteProp<WalletSyncNavigatorStackParamList, ScreenName.WalletSyncActivationProcess>
    >();
  const seededOffer = params?.seededOffer === true;
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);
  const trackingFlow = useWalletSyncTrackingFlow();
  const createSessionSdk = useCreateSessionSdk();

  // Without a trustchain to join, only a new setup or a completed onboarding may create one.
  const checkTrustchainsExist: NonNullable<GetOrCreateTrustchainCallbacks["onInitialResponse"]> =
    useCallback(
      trustchains => {
        if (
          onboardingType === OnboardingType.setupNew ||
          hasCompletedOnboarding ||
          Object.keys(trustchains).length > 0
        )
          return;
        throw new NoTrustchainInitialized();
      },
      [hasCompletedOnboarding, onboardingType],
    );

  const onDeviceRejected = useCallback((connectionResult: DeviceConnectionResult | undefined) => {
    track(AnalyticsEvents.LedgerSyncRejectedOnDevice, {
      page: "Ledger Sync",
      modelId: connectionResult
        ? dmkToLedgerDeviceIdMap[connectionResult.connectedDevice.modelId]
        : undefined,
      connectionType: connectionResult?.compatDeviceWired
        ? CONNECTION_TYPES.USB
        : CONNECTION_TYPES.BLE,
    });
  }, []);

  const step = useLedgerSyncIntentStep<AddMemberIntent>({
    buildIntent: () => {
      if (!memberCredentials) throw new Error("memberCredentials is not set");
      const input: AddMemberIntentInput = {
        memberCredentials,
        currentTrustchain: trustchain ?? undefined,
        createSessionSdk,
        onInitialResponse: checkTrustchainsExist,
      };
      return createIntent(addMemberIntentLWMDefinition, input, { onResult });
    },
    onDeviceRejected,
  });

  function onResult(trustchainResult: TrustchainResult) {
    dispatch(setTrustchain(trustchainResult.trustchain));
    track(AnalyticsEvents.LedgerSyncActivated, { flow: trackingFlow });
    step.finish();
    if (seededOffer) {
      navigation.getParent()?.goBack();
      return;
    }
    navigation.navigate(ScreenName.WalletSyncLoading, {
      created: trustchainResult.type === TrustchainResultType.created,
    });
  }

  return step;
}
