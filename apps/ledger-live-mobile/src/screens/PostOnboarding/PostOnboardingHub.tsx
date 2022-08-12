import React, { useCallback, useEffect, useState } from "react";
import { Box, Flex, Icons, Notification, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import {
  useClearLastActionCompletedCallback,
  usePostOnboardingHubState,
} from "../../logic/postOnboarding/hooks";
import PostOnboardingActionRow from "../../components/PostOnboarding/PostOnboardingActionRow";
import { NavigatorName, ScreenName } from "../../const";
import Button from "../../components/Button";

const SafeContainer = styled(SafeAreaView).attrs({
  edges: ["left", "bottom", "right"],
})`
  flex: 1;
`;

const Divider = styled(Box).attrs({
  height: 0.5,
  backgroundColor: "neutral.c30",
  width: "100%",
})``;

export default () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { lastActionCompleted, actionsState } = usePostOnboardingHubState();
  const [popupOpened, setPopupOpened] = useState(true);
  const { actionCompletedHubTitle, actionCompletedPopupLabel } =
    lastActionCompleted ?? {};

  const clearLastActionCompleted = useClearLastActionCompletedCallback();

  useEffect(
    () => () => {
      /**
       * the last action context (specific title & popup) should only be visible
       * the 1st time the hub is navigated to after that action was completed.
       * */
      clearLastActionCompleted();
    },
    [clearLastActionCompleted],
  );

  useEffect(() => {
    /**
     * Necessary because this component doesn't necessarily unmount when
     * navigating to another screen, so we need to open the popup again in case
     * the user closed it and then completed a new action.
     */
    setPopupOpened(true);
  }, [actionCompletedPopupLabel]);

  const navigateToWallet = useCallback(() => {
    navigation.navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
  }, [navigation]);

  const handleClosePopup = useCallback(() => {
    setPopupOpened(false);
  }, [setPopupOpened]);

  const allDone = actionsState.every(action => action.completed);
  return (
    <SafeContainer>
      <Flex px={6} py={7} justifyContent="space-between" flex={1}>
        <Text variant="h1Inter" fontWeight="semiBold" mb="34px">
          {actionCompletedHubTitle
            ? t(actionCompletedHubTitle)
            : t("postOnboarding.hub.title")}
        </Text>
        <Text variant="paragraph" mb={4} color="neutral.c70">
          {t("postOnboarding.hub.subtitle")}
        </Text>
        <ScrollView>
          {actionsState.map((action, index, arr) => (
            <>
              <PostOnboardingActionRow key={index} {...action} />
              {index !== arr.length - 1 && <Divider />}
            </>
          ))}
        </ScrollView>
        {!!actionCompletedPopupLabel && popupOpened && (
          <Notification
            Icon={Icons.CircledCheckSolidMedium}
            iconColor="success.c50"
            variant="plain"
            title={t(actionCompletedPopupLabel)}
            onClose={handleClosePopup}
          />
        )}
        <Flex mt={8}>
          {allDone ? (
            <Button type="main" size="large" onPress={navigateToWallet}>
              {t("postOnboarding.hub.goToWallet")}
            </Button>
          ) : (
            <Text
              variant="large"
              fontWeight="semiBold"
              alignSelf="center"
              onPress={navigateToWallet}
              color="primary.c80"
            >
              {t("postOnboarding.hub.skip")}
            </Text>
          )}
        </Flex>
      </Flex>
    </SafeContainer>
  );
};
