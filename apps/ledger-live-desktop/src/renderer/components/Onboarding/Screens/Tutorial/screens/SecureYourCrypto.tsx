import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, Column, SubTitle } from "../shared";
import { Flex } from "@ledgerhq/react-ui/index";
import TrackPage from "~/renderer/analytics/TrackPage";
import NewSeedIllustration from "~/newArch/features/Onboarding/screens/SyncOnboardingCompanion/components/NewSeedPanel/NewSeedIllustration";

export function SecureYourCrypto() {
  const { t } = useTranslation();

  return (
    <Column>
      <TrackPage category="Set up device" name="Secure your crypto" />
      <Title>{t("onboarding.screens.tutorial.screens.secureYourCrypto.title")}</Title>
      <SubTitle>{t("onboarding.screens.tutorial.screens.secureYourCrypto.description")}</SubTitle>
      <Flex flex={1} justifyContent="center" mt="150px">
        <NewSeedIllustration />
      </Flex>
    </Column>
  );
}

SecureYourCrypto.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.secureYourCrypto.buttons.next" />
);

SecureYourCrypto.continueLabelSecondary = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.secureYourCrypto.buttons.nextSecondary" />
);
