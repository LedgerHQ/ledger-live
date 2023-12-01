import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import { ModalHeader } from "@ledgerhq/native-ui/components/Layout/Modals/BaseModal/index";
import React from "react";
import { useTranslation } from "react-i18next";
import QueuedDrawer from "~/components/QueuedDrawer";

const OnboardingRecoveryPhraseWarning = ({
  open,
  onClose,
  onPress,
}: {
  open: boolean;
  onClose: () => void;
  onPress: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <QueuedDrawer isRequestingToBeOpened={open} onClose={onClose}>
      <ModalHeader
        Icon={IconsLegacy.WarningMedium}
        iconColor={"warning.c50"}
        title={t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.title")}
        description={t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.desc")}
      />

      <Button
        type="main"
        size="large"
        onPress={onPress}
        mt={4}
        testID="onboarding-importRecoveryPhrase-warning"
      >
        {t("onboarding.stepRecoveryPhrase.importRecoveryPhrase.warning.cta")}
      </Button>
    </QueuedDrawer>
  );
};

export default OnboardingRecoveryPhraseWarning;
