import React, { ReactNode, useCallback } from "react";
import { Linking, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { Flex, IconsLegacy, Link, Text, Divider } from "@ledgerhq/native-ui";
import styled from "styled-components/native";

import {
  useAcceptGeneralTerms,
  useGeneralTermsAccepted,
  useLocalizedTermsUrl,
} from "~/logic/terms";
import Button from "./Button";
import Alert from "./Alert";
import QueuedDrawer from "./QueuedDrawer";

const Description = styled(Text).attrs(() => ({
  color: "neutral.c70",
}))``;

const Update = ({ children }: { children: ReactNode }) => (
  <Flex flexDirection="row">
    <Description mr={2}>{"•"}</Description>
    <Description>{children}</Description>
  </Flex>
);

const CheckTermOfUseUpdateModal = () => {
  const { t } = useTranslation();
  const accepted = useGeneralTermsAccepted();
  const accept = useAcceptGeneralTerms();
  const termsUrl = useLocalizedTermsUrl();

  const handleLink = useCallback(() => {
    Linking.openURL(termsUrl);
  }, [termsUrl]);

  return (
    <QueuedDrawer
      noCloseButton={true}
      title={t("updatedTerms.title")}
      isRequestingToBeOpened={!accepted}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Flex px={4}>
          <Flex mb={6}>
            <Description>{t("updatedTerms.body.intro")}</Description>
            <Flex my={4}>
              <Update>{t("updatedTerms.body.bulletPoints.0")}</Update>
              <Update>{t("updatedTerms.body.bulletPoints.1")}</Update>
              <Update>{t("updatedTerms.body.bulletPoints.2")}</Update>
            </Flex>
            <Description>{t("updatedTerms.body.agreement")}</Description>
          </Flex>

          <Alert type="help" noIcon>
            <Link type="color" onPress={handleLink} Icon={IconsLegacy.ExternalLinkMedium}>
              {t("updatedTerms.link")}
            </Link>
          </Alert>
          <Divider />
          <Button type="main" outline={false} onPress={accept}>
            {t("updatedTerms.cta")}
          </Button>
        </Flex>
      </ScrollView>
    </QueuedDrawer>
  );
};

export default CheckTermOfUseUpdateModal;
