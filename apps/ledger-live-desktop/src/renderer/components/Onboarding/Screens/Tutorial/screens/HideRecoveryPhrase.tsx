import React from "react";
import { useTranslation, Trans } from "react-i18next";
import { Title, SubTitle, Bullet, Column, Row } from "../shared";
import { Button, IconsLegacy } from "@ledgerhq/react-ui";
type Props = {
  handleHelp: () => void;
};

export function HideRecoveryPhrase({ handleHelp }: Props) {
  const { t } = useTranslation();

  return (
    <Column>
      <Title>{t("onboarding.screens.tutorial.screens.hideRecoveryPhrase.title")}</Title>
      <SubTitle mb={8}>
        {t("onboarding.screens.tutorial.screens.hideRecoveryPhrase.paragraph")}
      </SubTitle>
      <Bullet
        icon="NanoFolded"
        text={t("onboarding.screens.tutorial.screens.hideRecoveryPhrase.keepItOffline")}
      />
      <Bullet
        icon="EyeNone"
        text={t("onboarding.screens.tutorial.screens.hideRecoveryPhrase.neverShowToAnyone")}
      />
      <Row>
        <Button
          onClick={handleHelp}
          Icon={IconsLegacy.HelpMedium}
          iconSize={18}
          iconPosition="right"
        >
          {t("onboarding.screens.tutorial.screens.hideRecoveryPhrase.buttons.learn")}
        </Button>
      </Row>
    </Column>
  );
}

HideRecoveryPhrase.continueLabel = (
  <Trans i18nKey="onboarding.screens.tutorial.screens.hideRecoveryPhrase.buttons.next" />
);
