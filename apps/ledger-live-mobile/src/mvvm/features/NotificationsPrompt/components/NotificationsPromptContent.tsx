import React from "react";
import { Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ABTestingVariants } from "@ledgerhq/types-live";
import { type NotificationsState } from "~/reducers/types";

type NotificationsPromptContentProps = {
  drawerSource: NotificationsState["drawerSource"];
};

export const NotificationsPromptContent = ({ drawerSource }: NotificationsPromptContentProps) => {
  const { t } = useTranslation();
  const featureNewWordingNotificationsDrawer = useFeature("lwmNewWordingOptInNotificationsDrawer");

  // A/B test for onboarding source
  if (drawerSource === "onboarding") {
    const isVariantB =
      featureNewWordingNotificationsDrawer?.enabled === true &&
      featureNewWordingNotificationsDrawer?.params?.variant === ABTestingVariants.variantB;

    return (
      <>
        <Title>
          {isVariantB ? t("notifications.prompt.titleVariantB") : t("notifications.prompt.title")}
        </Title>
        <Description>
          {isVariantB ? t("notifications.prompt.descVariantB") : t("notifications.prompt.desc")}
        </Description>
      </>
    );
  }

  // Always show variant B for non-onboarding sources
  return (
    <>
      <Title>{t("notifications.prompt.titleVariantB")}</Title>
      <Description>{t("notifications.prompt.descVariantB")}</Description>
    </>
  );
};

function Title(props: React.ComponentProps<typeof Text>) {
  return <Text variant="h4" fontWeight="semiBold" color="neutral.c100" mt={5} {...props} />;
}

function Description(props: React.ComponentProps<typeof Text>) {
  return (
    <Text
      variant="bodyLineHeight"
      fontWeight="medium"
      color="neutral.c70"
      textAlign="center"
      mt={3}
      {...props}
    />
  );
}
