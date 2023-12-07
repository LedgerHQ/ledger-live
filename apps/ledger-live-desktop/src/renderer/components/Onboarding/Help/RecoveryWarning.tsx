import { Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import FakeLink from "~/renderer/components/FakeLink";
import { ScrollArea } from "~/renderer/components/Onboarding/ScrollArea";
import TriangleWarning from "~/renderer/icons/TriangleWarning";
import { openURL } from "~/renderer/linking";

const PinHelpContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 76px;
`;

export default function RecoveryWarning() {
  const { t } = useTranslation();

  const urlFaq = useLocalizedUrl(urls.faq);

  const onClickLink = () => openURL(urlFaq);

  return (
    <ScrollArea isInsideDrawer>
      <PinHelpContainer>
        <Text mt={4} textAlign="center" color="warning">
          <TriangleWarning size={56} />
        </Text>

        <Text
          color="palette.text.shade100"
          ff="Inter|SemiBold"
          fontSize="22px"
          lineHeight="26.63px"
        >
          {t("onboarding.screens.tutorial.screens.existingRecoveryPhrase.warning.title")}
        </Text>
        <Text
          mt="8px"
          color="palette.text.shade100"
          ff="Inter|Regular"
          fontSize="14px"
          lineHeight="19.5px"
        >
          {t("onboarding.screens.tutorial.screens.existingRecoveryPhrase.warning.desc")}
        </Text>
        <FakeLink onClick={onClickLink}>
          <Text
            mt="8px"
            color="palette.primary.main"
            ff="Inter|Regular"
            fontSize="14px"
            lineHeight="19.5px"
          >
            {t("onboarding.screens.tutorial.screens.existingRecoveryPhrase.warning.supportLink")}
          </Text>
        </FakeLink>
      </PinHelpContainer>
    </ScrollArea>
  );
}
