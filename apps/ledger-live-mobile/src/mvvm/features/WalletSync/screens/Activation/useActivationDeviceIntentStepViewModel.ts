import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  buildAddMemberIntentInput,
  trackLedgerSyncActivated,
  trackLedgerSyncRejectedOnDevice,
  useLedgerSyncResultAcceptance,
} from "@features/flow-ledger-sync";
import { createIntent, type DeviceConnectionResult } from "@features/platform-device-intent";
import {
  selectKeyRingSession,
  type AddMemberIntent,
  type KeyRingActivation,
  type KeyRingSession,
} from "@features/platform-key-ring";
import { selectHasKeyRingMemberKey } from "@domain/entity-key-ring";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { useSelector } from "~/context/hooks";
import { NavigatorName, ScreenName } from "~/const";
import { hasCompletedOnboardingSelector, onboardingTypeSelector } from "~/reducers/settings";
import { OnboardingType } from "~/reducers/types";
import { CONNECTION_TYPES } from "~/analytics/hooks/variables";
import { useWalletSyncTrackingFlow } from "../../hooks/useLedgerSyncAnalytics";
import { addMemberIntentLWMDefinition } from "../../deviceIntents/addMemberIntent/intentLWMDefinition";
import { useKeyRingClient } from "../../hooks/useKeyRingClient";
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
  const navigation = useNavigation<LedgerSyncStepNavigation>();
  const session = useSelector(selectKeyRingSession);
  const hasMemberKey = useSelector(selectHasKeyRingMemberKey);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingType = useSelector(onboardingTypeSelector);
  const trackingFlow = useWalletSyncTrackingFlow();
  const client = useKeyRingClient();

  // Without a trustchain to join, only a new setup or a completed onboarding may create one.
  const allowTreeCreation = onboardingType === OnboardingType.setupNew || hasCompletedOnboarding;

  const onDeviceRejected = useCallback((connectionResult: DeviceConnectionResult | undefined) => {
    trackLedgerSyncRejectedOnDevice({
      modelId: connectionResult
        ? dmkToLedgerDeviceIdMap[connectionResult.connectedDevice.modelId]
        : undefined,
      connectionType: connectionResult?.compatDeviceWired
        ? CONNECTION_TYPES.USB
        : CONNECTION_TYPES.BLE,
    });
  }, []);

  const { resultRef: activatedRef, accept } = useLedgerSyncResultAcceptance<{
    activation: KeyRingActivation;
    seededOffer: boolean;
  }>();

  const step = useLedgerSyncIntentStep<AddMemberIntent, ActivationStepInput>({
    input,
    onClose,
    isReady: hasMemberKey,
    buildIntent: ({ seededOffer }) => {
      if (!hasMemberKey) throw new Error("memberCredentials is not set");
      const intentInput = buildAddMemberIntentInput({ session, client, allowTreeCreation });
      return createIntent(addMemberIntentLWMDefinition, intentInput, {
        onResult: activation => onResult(activation, seededOffer === true, session),
      });
    },
    onDeviceRejected,
    onCompleted,
  });

  function onResult(
    activation: KeyRingActivation,
    seededOffer: boolean,
    runSession: KeyRingSession,
  ) {
    // A disconnected run and its Retry can both deliver: one activation, one event.
    accept(activation.tree, runSession, { activation, seededOffer }, () =>
      trackLedgerSyncActivated({ flow: trackingFlow }),
    );
  }

  function onCompleted() {
    const activated = activatedRef.current;
    if (!activated) return;
    const { activation, seededOffer } = activated;
    onActivated();
    step.finish();
    if (seededOffer) return;
    navigation.navigate(NavigatorName.WalletSync, {
      screen: ScreenName.WalletSyncLoading,
      params: { created: activation.outcome === "created" },
    });
  }

  return step;
}
