import React, { useCallback, useEffect, useState } from "react";
import { Flex, IconsLegacy, Tag, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { PostOnboardingActionState, PostOnboardingAction, Account } from "@ledgerhq/types-live";
import Touchable from "../Touchable";
import { track } from "~/analytics";
import { BaseNavigationComposite, StackNavigatorNavigation } from "../RootNavigator/types/helpers";
import { PostOnboardingNavigatorParamList } from "../RootNavigator/types/PostOnboardingNavigator";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useCompleteActionCallback } from "~/logic/postOnboarding/useCompleteAction";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { HOOKS_TRACKING_LOCATIONS } from "~/analytics/hooks/variables";
import { usePostOnboardingActionHandlers } from "~/logic/postOnboarding/usePostOnboardingActionHandlers";

export type Props = PostOnboardingAction &
  PostOnboardingActionState & {
    deviceModelId: DeviceModelId;
    productName: string;
    isLedgerSyncActive: boolean;
    openActivationDrawer: () => void;
    accounts: Account[];
  };

const PostOnboardingActionRow: React.FC<Props> = props => {
  const {
    id,
    Icon,
    title,
    titleCompleted,
    description,
    tagLabel,
    completed,
    getIsAlreadyCompletedByState,
    disabled,
    buttonLabelForAnalyticsEvent,
    deviceModelId,
    productName,
    shouldCompleteOnStart,
    openActivationDrawer,
    isLedgerSyncActive,
    accounts,
  } = props;
  const { t } = useTranslation();
  const recoverServices = useFeature("protectServicesMobile");
  const protectId = recoverServices?.params?.protectId ?? "protect-prod";

  const navigation =
    useNavigation<
      BaseNavigationComposite<StackNavigatorNavigation<PostOnboardingNavigatorParamList>>
    >();
  const completeAction = useCompleteActionCallback();
  const [isActionCompleted, setIsActionCompleted] = useState(false);

  const initIsActionCompleted = useCallback(async () => {
    const isAlreadyCompleted = getIsAlreadyCompletedByState?.({ isLedgerSyncActive, accounts });
    setIsActionCompleted(completed || !!isAlreadyCompleted);
  }, [setIsActionCompleted, completed, getIsAlreadyCompletedByState, isLedgerSyncActive, accounts]);

  useEffect(() => {
    initIsActionCompleted();
  }, [initIsActionCompleted]);

  const customActionHandlers = usePostOnboardingActionHandlers();

  const handlePress = () => {
    const trackAction = () => {
      buttonLabelForAnalyticsEvent &&
        track("button_clicked", {
          button: buttonLabelForAnalyticsEvent,
          deviceModelId,
          flow: "post-onboarding",
        });
    };

    // Execute custom handler if it exists
    const customHandler = customActionHandlers[id];
    if (customHandler) {
      customHandler();
    } else if ("getNavigationParams" in props) {
      // Continue with standard navigation flow

      const navigationArgs = props.getNavigationParams({
        deviceModelId,
        protectId,
        referral: HOOKS_TRACKING_LOCATIONS.onboardingFlow,
      });
      navigation.navigate(navigationArgs[0], navigationArgs[1]);
    } else if ("startAction" in props) {
      props.startAction({
        openActivationDrawer,
      });
    }

    trackAction();
    shouldCompleteOnStart && completeAction(id);
  };

  return (
    <Touchable
      disabled={disabled || isActionCompleted}
      onPress={isActionCompleted ? undefined : handlePress}
    >
      <Flex
        flexDirection="row"
        alignItems="center"
        py={6}
        justifyContent="space-between"
        opacity={disabled ? 0.5 : 1}
      >
        <Flex flexDirection="row" alignItems="flex-start" flexShrink={1}>
          <Icon size={"M"} color={"primary.c80"} />
          <Flex ml={6} flexDirection="column" justifyContent="center" flex={1}>
            <Flex flexDirection="row" alignItems="center">
              <Text
                variant="largeLineHeight"
                fontWeight="medium"
                color={isActionCompleted ? "neutral.c70" : "neutral.c100"}
              >
                {t(isActionCompleted ? titleCompleted : title)}
              </Text>
              {tagLabel ? (
                <Tag size="small" ml={3} type="color" uppercase={false}>
                  {t(tagLabel)}
                </Tag>
              ) : null}
            </Flex>
            {isActionCompleted ? null : (
              <Text variant="body" fontWeight="medium" color="neutral.c70">
                {t(description, { productName })}
              </Text>
            )}
          </Flex>
        </Flex>
        <Flex flexDirection="row" alignItems="center" flexShrink={0} flexGrow={1} pl={6}>
          {disabled ? null : isActionCompleted ? (
            <IconsLegacy.CheckAloneMedium color="success.c50" size={20} />
          ) : (
            <IconsLegacy.ChevronRightMedium color="neutral.c70" size={24} />
          )}
        </Flex>
      </Flex>
    </Touchable>
  );
};

export default PostOnboardingActionRow;
