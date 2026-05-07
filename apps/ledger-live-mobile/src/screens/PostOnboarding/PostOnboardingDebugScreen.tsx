import { DeviceModelId } from "@ledgerhq/devices/index";
import React, { useCallback } from "react";
import { ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useStartPostOnboardingCallback } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import SettingsRow from "~/components/SettingsRow";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import { NavigatorName } from "~/const";
import SafeAreaViewFixed from "~/components/SafeAreaView";
import { usePostOnboardingHubCompletionContext } from "~/logic/postOnboarding/usePostOnboardingHubCompletionContext";
import { setStoreValue } from "~/store";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { removePostOnboardingActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useDispatch } from "~/context/hooks";
import {
  setDisplayBanner,
  setRecoverState as setRecoverStateAction,
} from "~/reducers/recoverState";

export default () => {
  const navigation = useNavigation();
  const startPostOnboarding = useStartPostOnboardingCallback();
  const dispatch = useDispatch();

  const { protectId } = usePostOnboardingHubCompletionContext();
  const setRecoverState = async (input: LedgerRecoverSubscriptionStateEnum) => {
    await setStoreValue("SUBSCRIPTION_STATE", String(input), protectId);
    await setStoreValue("DISPLAY_BANNER", "true", protectId);
    dispatch(setDisplayBanner({ protectId, displayBanner: true }));
    dispatch(setRecoverStateAction({ protectId, subscriptionState: input }));
    dispatch(removePostOnboardingActionCompleted({ actionId: PostOnboardingActionId.recover }));
  };

  const handleInitPostOnboardingHub = useCallback(
    (deviceId: DeviceModelId, mock: boolean) =>
      startPostOnboarding({
        deviceModelId: deviceId,
        mock,
        fallbackIfNoAction: () =>
          navigation.navigate(NavigatorName.Main, {
            screen: NavigatorName.Portfolio,
            params: { screen: NavigatorName.WalletTab },
          }),
      }),
    [navigation, startPostOnboarding],
  );

  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  return (
    <SafeAreaViewFixed isFlex edges={["bottom"]}>
      <ScrollView>
        <SettingsRow
          title="Start (mock) post onboarding for stax"
          desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
          onPress={() => handleInitPostOnboardingHub(DeviceModelId.stax, true)}
        />
        <SettingsRow
          title="Start post onboarding for stax"
          desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
          onPress={() => handleInitPostOnboardingHub(DeviceModelId.stax, false)}
        />
        <SettingsRow
          title="Start (mock) post onboarding for europa"
          desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
          onPress={() => handleInitPostOnboardingHub(DeviceModelId.europa, true)}
        />
        <SettingsRow
          title="Start post onboarding for europa"
          desc="Pressing this should trigger navigation to the post onboarding hub populated with a list of actions."
          onPress={() => handleInitPostOnboardingHub(DeviceModelId.europa, false)}
        />
        <SettingsRow
          title="Start (mock) post onboarding for nanoX"
          desc="Pressing this should not do anything. (no actions configured for this device)."
          onPress={() => handleInitPostOnboardingHub(DeviceModelId.nanoX, true)}
        />
        <SettingsRow title="Open post onboarding hub" onPress={navigateToPostOnboardingHub} />

        <SettingsRow
          title="Recover - No Subscription"
          desc="Set recover local state to no subscription"
          onPress={() => setRecoverState(LedgerRecoverSubscriptionStateEnum.NO_SUBSCRIPTION)}
        />
        <SettingsRow
          title="Recover - In Progress"
          desc="Set recover local state to being in progress"
          onPress={() => setRecoverState(LedgerRecoverSubscriptionStateEnum.BACKUP_VERIFY_IDENTITY)}
        />
        <SettingsRow
          title="Recover - Complete"
          desc="Set recover local state to being complete"
          onPress={() => setRecoverState(LedgerRecoverSubscriptionStateEnum.BACKUP_DONE)}
        />
      </ScrollView>
    </SafeAreaViewFixed>
  );
};
