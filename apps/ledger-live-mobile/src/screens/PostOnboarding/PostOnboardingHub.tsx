import React, { useCallback, useEffect } from "react";
import { Divider, Flex, Text, Button } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useAllPostOnboardingActionsCompleted,
  usePostOnboardingHubState,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { clearPostOnboardingLastActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { useDispatch, useSelector } from "react-redux";
import { getDeviceModel } from "@ledgerhq/devices";
import PostOnboardingActionRow from "~/components/PostOnboarding/PostOnboardingActionRow";
import { TrackScreen } from "~/analytics";
import Link from "~/components/wrappedUi/Link";
import { useCompletePostOnboarding } from "~/logic/postOnboarding/useCompletePostOnboarding";
import { ScrollContainer, Icons } from "@ledgerhq/native-ui";
import { setHasBeenRedirectedToPostOnboarding, setIsPostOnboardingFlow } from "~/actions/settings";
import ActivationDrawer from "LLM/features/WalletSync/screens/Activation/ActivationDrawer";
import { Steps } from "LLM/features/WalletSync/types/Activation";
import useLedgerSyncEntryPointViewModel from "LLM/features/LedgerSyncEntryPoint/useLedgerSyncEntryPointViewModel";
import { EntryPoint } from "LLM/features/LedgerSyncEntryPoint/types";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";
import { accountsSelector } from "~/reducers/accounts";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

const PostOnboardingHub = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const closePostOnboarding = useCompletePostOnboarding();
  const isLedgerSyncActive = Boolean(useSelector(trustchainSelector)?.rootId);
  const accounts = useSelector(accountsSelector);

  const { isActivationDrawerVisible, closeActivationDrawer, openActivationDrawer } =
    useLedgerSyncEntryPointViewModel({
      entryPoint: EntryPoint.postOnboarding,
      page: "PostOnboarding",
    });

  useEffect(() => {
    if (isActivationDrawerVisible) {
      dispatch(setIsPostOnboardingFlow(true));
    }
  }, [dispatch, isActivationDrawerVisible]);

  useEffect(() => {
    /**
     * The last action context (specific title & popup) should only be visible
     * the 1st time the hub is navigated to after that action was completed.
     * So here we clear the last action completed.
     * */
    dispatch(clearPostOnboardingLastActionCompleted());
    dispatch(setHasBeenRedirectedToPostOnboarding(true));
  }, [dispatch]);

  const navigateToMainScreen = useCallback(() => {
    closePostOnboarding();
  }, [closePostOnboarding]);

  const safeAreaInsets = useSafeAreaInsets();
  const areAllPostOnboardingActionsCompleted =
    useAllPostOnboardingActionsCompleted() || !deviceModelId;

  if (!deviceModelId) return null; // this will never happen in practice

  const productName = getDeviceModel(deviceModelId).productName;
  return (
    <>
      <TrackScreen
        key={areAllPostOnboardingActionsCompleted.toString()}
        category={
          areAllPostOnboardingActionsCompleted
            ? "User has completed all post-onboarding actions"
            : "Post-onboarding hub"
        }
        deviceModelId={deviceModelId}
        flow="post-onboarding"
      />
      <Flex
        px={6}
        py={7}
        justifyContent="space-between"
        flex={1}
        paddingBottom={safeAreaInsets.bottom}
        testID="post-onboarding-hub-container"
      >
        <Flex pb={8}>
          <Text variant="h1Inter" fontWeight="semiBold">
            {areAllPostOnboardingActionsCompleted
              ? t("postOnboarding.hub.areAllPostOnboardingActionsCompletedTitle")
              : t("postOnboarding.hub.title", { productName })}
          </Text>
        </Flex>
        <ScrollContainer
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "space-between",
            flexDirection: "column",
          }}
        >
          <Flex>
            <PostOnboardingActionRow
              id={PostOnboardingActionId.deviceOnboarded}
              title="postOnboarding.actions.deviceOnboarded.titleCompleted"
              titleCompleted="postOnboarding.actions.deviceOnboarded.titleCompleted"
              description=""
              completed
              Icon={Icons.LedgerDevices}
              startAction={() => {}}
              deviceModelId={deviceModelId}
              productName={productName}
            />
            <Divider />
            {actionsState.map((action, index, arr) => (
              <React.Fragment key={index}>
                <PostOnboardingActionRow
                  {...action}
                  deviceModelId={deviceModelId}
                  productName={productName}
                  openActivationDrawer={openActivationDrawer}
                  isLedgerSyncActive={isLedgerSyncActive}
                  accounts={accounts}
                />
                {index !== arr.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Flex>
          <Flex my={7} alignItems="center" justifyContent="center">
            {areAllPostOnboardingActionsCompleted ? (
              <Button
                alignSelf="stretch"
                size="large"
                type="main"
                outline={false}
                onPress={navigateToMainScreen}
              >
                {t("postOnboarding.hub.viewWallet")}
              </Button>
            ) : (
              <Link
                size="large"
                onPress={navigateToMainScreen}
                event="button_clicked"
                eventProperties={{
                  button: "I'll do this later",
                  deviceModelId,
                  flow: "post-onboarding",
                }}
                testID="post-onboarding-hub-skip-button"
              >
                {t("postOnboarding.hub.skip")}
              </Link>
            )}
          </Flex>
        </ScrollContainer>

        <ActivationDrawer
          startingStep={Steps.Activation}
          isOpen={isActivationDrawerVisible}
          handleClose={closeActivationDrawer}
        />
      </Flex>
    </>
  );
};

export default PostOnboardingHub;
