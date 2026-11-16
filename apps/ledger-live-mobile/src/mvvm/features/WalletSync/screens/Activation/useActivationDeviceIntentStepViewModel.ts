import { useCallback, useRef } from "react";
import { useNavigation } from "@react-navigation/native";
import { track } from "@shared/analytics";
import { createIntent, type DeviceConnectionResult } from "@features/platform-device-intent";
import {
  isCurrentMemberCredentials,
  type AddMemberIntent,
  type AddMemberIntentInput,
} from "@features/platform-intent-wallet-sync";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import {
  memberCredentialsSelector,
  setTrustchain,
  trustchainSelector,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { NoTrustchainInitialized } from "@ledgerhq/ledger-key-ring-protocol/errors";
import {
  type GetOrCreateTrustchainCallbacks,
  type MemberCredentials,
  type TrustchainResult,
  TrustchainResultType,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { useDispatch, useSelector, useStore } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { hasCompletedOnboardingSelector, onboardingTypeSelector } from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";
import { AnalyticsEvents } from "../../Analytics/enums";
import { useWalletSyncTrackingFlow } from "../../hooks/useLedgerSyncAnalytics";
import { addMemberIntentLWMDefinition } from "../../deviceIntents/addMemberIntent/intentLWMDefinition";
import { useCreateSessionSdk } from "../../deviceIntents/useCreateSessionSdk";
import { ledgerSyncResultOrder } from "../../deviceIntents/ledgerSyncResultOrder";
import {
  type LedgerSyncStepNavigation,
  useLedgerSyncIntentStep,
} from "../../deviceIntents/useLedgerSyncIntentStep";

export type ActivationStepInput = Readonly<{
  /** The onboarding sync offer: on success, the offer screen shows the sync itself. */
  seededOffer?: boolean;
}>;

type Props = Readonly<{
  input: ActivationStepInput;
  onClose: () => void;
  /** Called before `onClose` when the activation succeeded. */
  onActivated: () => void;
}>;

/** The add member step of the activation on DIE, with the outcomes of `useAddMember`. */
export function useActivationDeviceIntentStepViewModel({ input, onClose, onActivated }: Props) {
  const dispatch = useDispatch();
  const navigation = useNavigation<LedgerSyncStepNavigation>();
  const trustchain = useSelector(trustchainSelector);
  const memberCredentials = useSelector(memberCredentialsSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);
  const trackingFlow = useWalletSyncTrackingFlow();
  const createSessionSdk = useCreateSessionSdk();
  const store = useStore();

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

  const activatedRef = useRef<{ trustchainResult: TrustchainResult; seededOffer: boolean } | null>(
    null,
  );

  const step = useLedgerSyncIntentStep<AddMemberIntent, ActivationStepInput>({
    input,
    onClose,
    isReady: memberCredentials !== null,
    buildIntent: ({ seededOffer }) => {
      if (!memberCredentials) throw new Error("memberCredentials is not set");
      const intentInput: AddMemberIntentInput = {
        memberCredentials,
        currentTrustchain: trustchain ?? undefined,
        createSessionSdk,
        resultOrder: ledgerSyncResultOrder,
        onInitialResponse: checkTrustchainsExist,
      };
      return createIntent(addMemberIntentLWMDefinition, intentInput, {
        onResult: trustchainResult =>
          onResult(trustchainResult, seededOffer === true, memberCredentials),
      });
    },
    onDeviceRejected,
    onCompleted,
  });

  function onResult(
    trustchainResult: TrustchainResult,
    seededOffer: boolean,
    runCredentials: MemberCredentials,
  ) {
    if (!isCurrentMemberCredentials(store.getState(), runCredentials)) return;
    dispatch(setTrustchain(trustchainResult.trustchain));
    track(AnalyticsEvents.LedgerSyncActivated, { flow: trackingFlow });
    activatedRef.current = { trustchainResult, seededOffer };
  }

  function onCompleted() {
    const activated = activatedRef.current;
    if (!activated) return;
    const { trustchainResult, seededOffer } = activated;
    onActivated();
    step.finish();
    if (seededOffer) return;
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncLoading,
      params: { created: trustchainResult.type === TrustchainResultType.created },
    });
  }

  return step;
}
