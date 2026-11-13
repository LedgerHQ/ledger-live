import React from "react";
import { useTranslation } from "react-i18next";
import Text from "~/renderer/components/Text";

/** Legal disclaimer about community apps, always shown under the apps section. */
const AppsDisclaimer = () => {
  const { t } = useTranslation();

  return (
    <Text
      as="p"
      mt={3}
      px={4}
      ff="Inter|Regular"
      fontSize={3}
      color="neutral.c70"
      data-testid="manager-apps-disclaimer"
    >
      {`${t("manager.applist.communityDisclaimer.availability")} ${t(
        "manager.applist.communityDisclaimer.liability",
      )}`}
    </Text>
  );
};

export default AppsDisclaimer;
