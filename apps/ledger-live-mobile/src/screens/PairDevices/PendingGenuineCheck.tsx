import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { Alert, Flex, InfiniteLoader, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";

const PendingGenuineCheck = () => {
  const { t } = useTranslation();

  return (
    <Flex flex={1} justifyContent={"center"} alignItems={"center"} mx={6}>
      <TrackScreen category="PairDevices" name="PendingGenuineCheck" />
      <InfiniteLoader size={30} />
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
