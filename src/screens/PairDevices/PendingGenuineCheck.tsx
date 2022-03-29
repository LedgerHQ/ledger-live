import React from "react";
import { Trans, useTranslation } from "react-i18next";

import { Alert, Flex, IconBox, Text } from "@ledgerhq/native-ui";
import { WarningMedium } from "@ledgerhq/native-ui/assets/icons";
import { TrackScreen } from "../../analytics";

const PendingGenuineCheck = () => {
  const { t } = useTranslation();

  return (
    <Flex flex={1} justifyContent={"center"} alignItems={"center"} mx={6}>
      <TrackScreen category="PairDevices" name="PendingGenuineCheck" />
      <IconBox
        Icon={WarningMedium}
        iconSize={24}
        boxSize={64}
        color={"warning.c100"}
      />
      <Text variant={"h2"} textAlign={"center"} mb={5} mt={7}>
        <Trans i18nKey="PairDevices.GenuineCheck.title" />
      </Text>
      <Text
        variant={"bodyLineHeight"}
        fontWeight={"medium"}
        textAlign={"center"}
        color={"neutral.c80"}
        mb={8}
      >
        <Trans i18nKey="PairDevices.GenuineCheck.accept">
          {""}
          {""}
        </Trans>
      </Text>
      <Alert type={"info"} title={t("PairDevices.GenuineCheck.info")} />
    </Flex>
  );
};

export default PendingGenuineCheck;
