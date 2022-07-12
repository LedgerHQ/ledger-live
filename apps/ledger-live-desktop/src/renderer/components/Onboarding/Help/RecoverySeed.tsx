import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text, Button, Icons } from "@ledgerhq/react-ui";
import styled from "styled-components";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import FakeLink from "~/renderer/components/FakeLink";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";

const PinHelpContainer = styled(Flex).attrs({
  flexDirection: "column",
  mb: "80px",
})``;

export function RecoverySeed(props: { handleNextInDrawer: () => void }) {
  const { t } = useTranslation();

  const onClickLink = useCallback(() => openURL(urls.whatIsARecoveryPhrase), []);

  return (
    <>
      <ScrollArea>
        <PinHelpContainer>
          <Text color="palette.text.shade100" variant="h3">
            {t("onboarding.drawers.recoverySeed.title1")}
          </Text>
          <Text mt="8px" color="neutral.c80" ff="Inter|Regular" fontSize="14px" lineHeight="19.5px">
            {t("onboarding.drawers.recoverySeed.paragraph1")}
          </Text>
          <Text mt="8px" color="neutral.c80" ff="Inter|Regular" fontSize="14px" lineHeight="19.5px">
            {t("onboarding.drawers.recoverySeed.paragraph2")}
          </Text>
          <FakeLink onClick={onClickLink}>
            <Text
              mt="8px"
              color="neutral.c100"
              ff="Inter|Regular"
              fontSize="14px"
              lineHeight="19.5px"
            >
              {t("onboarding.drawers.recoverySeed.link")}
            </Text>
          </FakeLink>
          <Text mt="40px" color="palette.text.shade100" variant="h3">
            {t("onboarding.drawers.recoverySeed.title2")}
          </Text>
          <Text mt="8px" color="neutral.c80" ff="Inter|Regular" fontSize="14px" lineHeight="19.5px">
            {t("onboarding.drawers.recoverySeed.paragraph3")}
          </Text>
          <Text mt="8px" color="neutral.c80" ff="Inter|Regular" fontSize="14px" lineHeight="19.5px">
            {t("onboarding.drawers.recoverySeed.paragraph4")}
          </Text>
          <Text
            color="neutral.c100"
            ff="Inter|Regular"
            fontSize="14px"
            lineHeight="19.5px"
            mt="8px"
          >
            {t("onboarding.drawers.recoverySeed.points.1")}
          </Text>
          <Text
            color="neutral.c100"
            ff="Inter|Regular"
            fontSize="14px"
            lineHeight="19.5px"
            mt="8px"
          >
            {t("onboarding.drawers.recoverySeed.points.2")}
          </Text>
          <Text
            color="neutral.c100"
            ff="Inter|Regular"
            fontSize="14px"
            lineHeight="19.5px"
            mt="8px"
          >
            {t("onboarding.drawers.recoverySeed.points.3")}
          </Text>
        </PinHelpContainer>
      </ScrollArea>
      <Button
        data-test-id="v3-seed-drawer"
        left="-258px"
        width="248px"
        mt="auto"
        variant="main"
        onClick={props.handleNextInDrawer}
        Icon={() => <Icons.ArrowRightMedium size={18} />}
      >
        {t("onboarding.screens.welcome.nextButton")}
      </Button>
    </>
  );
}
