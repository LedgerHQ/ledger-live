import { Flex, Text, Link, Icons, Button, Checkbox } from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Linking, ScrollView } from "react-native";
import { urls } from "../../config/urls";
import SafeMarkdown from "../SafeMarkdown";

type Props = {
  firmwareVersion: string;
  firmwareNotes?: string | null;
  onContinue: () => void;
  onCancel: () => void;
};

const ConfirmRecoveryStep = ({
  firmwareVersion,
  firmwareNotes,
  onContinue,
  onCancel,
}: Props) => {
  const { t } = useTranslation();
  const [
    confirmRecoveryPhraseBackup,
    setConfirmRecoveryPhraseBackup,
  ] = useState(false);

  const toggleConfirmRecoveryPhraseBackup = useCallback(() => {
    setConfirmRecoveryPhraseBackup(!confirmRecoveryPhraseBackup);
  }, [confirmRecoveryPhraseBackup]);

  const openRecoveryPhraseInfo = React.useCallback(async () => {
    // Checking if the link is supported for links with custom URL scheme.
    const supported = await Linking.canOpenURL(urls.recoveryPhraseInfo);
    if (!supported) return;

    // Opening the link with some app, if the URL scheme is "http" the web link should be opened
    // by some browser in the mobile
    await Linking.openURL(urls.recoveryPhraseInfo);
  }, [urls.recoveryPhraseInfo]);

  return (
    <Flex height="100%">
      <ScrollView>
        <Text variant="h2" fontWeight="semiBold" mb={4}>
          <Trans
            i18nKey="FirmwareUpdateReleaseNotes.introTitle"
            values={{ version: firmwareVersion }}
          >
            {"You are about to install "}
            <Text
              variant="h2"
              fontWeight="semiBold"
            >{`firmware version ${firmwareVersion}`}</Text>
          </Trans>
        </Text>
        <SafeMarkdown markdown={firmwareNotes} />
      </ScrollView>
      <Text variant="paragraph" color="neutral.c80" mt={6}>
        {t("FirmwareUpdateReleaseNotes.recoveryPhraseBackupInstructions")}
      </Text>
      <Flex mt={6}>
        <Link
          onPress={openRecoveryPhraseInfo}
          Icon={Icons.ExternalLinkMedium}
          iconPosition="right"
          type="color"
          style={{ justifyContent: "flex-start" }}
        >
          {t("onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.link")}
        </Link>
      </Flex>
      <Flex height={1} mt={7} backgroundColor="neutral.c40" />
      {/** TODO: replace by divider component when we have one */}
      <Flex backgroundColor="neutral.c30" p={7} mt={8} borderRadius={5}>
        <Checkbox
          checked={confirmRecoveryPhraseBackup}
          onChange={toggleConfirmRecoveryPhraseBackup}
          label={t("FirmwareUpdateReleaseNotes.confirmRecoveryPhrase")}
        />
      </Flex>
      <Button
        onPress={onContinue}
        type="main"
        mt={8}
        disabled={!confirmRecoveryPhraseBackup}
      >
        {t("common.continue")}
      </Button>
      <Button onPress={() => onCancel()} mt={6}>
        {t("common.cancel")}
      </Button>
    </Flex>
  );
};

export default ConfirmRecoveryStep;
