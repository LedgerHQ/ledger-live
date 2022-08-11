import React, { useCallback, useEffect } from "react";
import { Box, Flex, Icons, Notification, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { useNavigation } from "@react-navigation/native";
import {
  useClearLastActionCompletedCallback,
  usePostOnboardingHubState,
} from "../../logic/postOnboarding/hooks";
import PostOnboardingActionRow from "../../components/PostOnboarding/PostOnboardingActionRow";
import ConfettiParty from "../../components/ConfettiParty";
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
  const { actionCompletedHubTitle, actionCompletedPopupLabel } =
    lastActionCompleted ?? {};

  // TODO: (design) "all done" state with confettis

  const clearLastActionCompleted = useClearLastActionCompletedCallback();

  useEffect(
    () => () => {
      clearLastActionCompleted();
    },
    [clearLastActionCompleted],
  );

  const navigateToWallet = useCallback(() => {
    navigation.navigate(NavigatorName.Main, { screen: ScreenName.Portfolio });
  }, [navigation]);

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
        {!!actionCompletedPopupLabel && (
          <Notification
            Icon={Icons.CircledCheckMedium}
            variant="success"
            title={t(actionCompletedPopupLabel)}
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
      {allDone && (
        <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
          {/* TODO: actually it's not this component we want */}
          <ConfettiParty />
        </View>
      )}
    </SafeContainer>
  );
};
