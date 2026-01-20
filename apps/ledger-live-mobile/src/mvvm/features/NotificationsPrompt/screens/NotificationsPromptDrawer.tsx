import React, { useEffect } from "react";
import { useTranslation } from "~/context/Locale";
import { Flex, Text, Link as TextLink, Button } from "@ledgerhq/native-ui";
import { useNotifications } from "LLM/features/NotificationsPrompt";
import QueuedDrawer from "~/components/QueuedDrawer";
import { NotificationsDrawerIllustration } from "../components/NotificationsDrawerIllustration";
import { TrackScreen } from "~/analytics";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ABTestingVariants } from "@ledgerhq/types-live";

export const NotificationsPromptDrawer = () => {
  const { t } = useTranslation();
  const {
    initPushNotificationsData,
    drawerSource,
    isPushNotificationsModalOpen,
    handleAllowNotificationsPress,
    handleDelayLaterPress,
    handleCloseFromBackdropPress,
    nextRepromptDelay,
    pushNotificationsDataOfUser,
  } = useNotifications();

  useEffect(() => {
    initPushNotificationsData();
    // We only want to call this once on mount
    // And we can't use the function reference because it has a lot of dependencies and will hence change often...
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  const canShowVariant =
    drawerSource === "onboarding" && featureNewWordingNotificationsDrawer?.enabled;
  const isVariantB =
    featureNewWordingNotificationsDrawer?.params?.variant === ABTestingVariants.variantB;

  return (
    <QueuedDrawer
      isRequestingToBeOpened={isPushNotificationsModalOpen}
      noCloseButton
      onBackdropPress={handleCloseFromBackdropPress}
    >
      <TrackScreen
        category="Drawer push notification opt-in"
        source={drawerSource}
        repromptDelay={nextRepromptDelay}
        dismissedCount={pushNotificationsDataOfUser?.dismissedOptInDrawerAtList?.length ?? 0}
        variant={canShowVariant ? featureNewWordingNotificationsDrawer?.params?.variant : undefined}
      />

      <Flex mb={4}>
        <Flex alignItems={"center"}>
          <NotificationsDrawerIllustration type={drawerSource} />

          <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mt={5}>
            {canShowVariant && isVariantB
              ? t("notifications.prompt.titleVariantB")
              : t("notifications.prompt.title")}
          </Text>

          <Text
            variant="bodyLineHeight"
            fontWeight="medium"
            color="neutral.c70"
            textAlign="center"
            mt={3}
          >
            {canShowVariant && isVariantB
              ? t("notifications.prompt.descVariantB")
              : t("notifications.prompt.desc")}
          </Text>
        </Flex>
        <Button
          type={"main"}
          mt={8}
          mb={7}
          onPressIn={handleAllowNotificationsPress}
          testID="notifications-prompt-allow"
        >
          {t("notifications.prompt.allow")}
        </Button>
        <TextLink
          type={"shade"}
          onPressIn={handleDelayLaterPress}
          testID="notifications-prompt-later"
        >
          {t("notifications.prompt.later")}
        </TextLink>
      </Flex>
    </QueuedDrawer>
  );
};
