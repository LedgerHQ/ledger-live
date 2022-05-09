import {
  Flex,
  Text,
  Link,
  Icons,
  Button,
  Checkbox,
  Alert,
} from "@ledgerhq/native-ui";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { Linking, ScrollView } from "react-native";
import { track } from "../../analytics";
import Track from "../../analytics/Track";
import { urls } from "../../config/urls";
import SafeMarkdown from "../SafeMarkdown";

type Props = {
  firmwareVersion: string;
  firmwareNotes?: string | null;
  onContinue: () => void;
  device: Device;
};

const ConfirmRecoveryStep = ({
  firmwareVersion,
  firmwareNotes,
  onContinue,
  device,
}: Props) => {
  const { t } = useTranslation();
  const [
    confirmRecoveryPhraseBackup,
    setConfirmRecoveryPhraseBackup,
  ] = useState(false);

  const toggleConfirmRecoveryPhraseBackup = useCallback(() => {
    track("FirmwareUpdateSeedDisclaimerChecked");
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
      <Track event="FirmwareUpdateChangelog" onMount />
      <ScrollView persistentScrollbar>
        <Flex px={3}>
          <Text variant="h2" fontWeight="semiBold" mb={4}>
            {t("FirmwareUpdateReleaseNotes.introTitle", {
              version: firmwareVersion,
              deviceName: device.deviceName?.replace(/\u00a0/g, ' '),
            })}
          </Text>
          <Alert
            type="info"
            title={t(
              "FirmwareUpdateReleaseNotes.recoveryPhraseBackupInstructions",
            )}
          />
          <Flex mt={6}>
            <Link
              onPress={openRecoveryPhraseInfo}
              Icon={Icons.ExternalLinkMedium}
              iconPosition="right"
              type="color"
              style={{ justifyContent: "flex-start" }}
            >
              {t(
                "onboarding.stepSetupDevice.recoveryPhraseSetup.infoModal.link",
              )}
            </Link>
          </Flex>
          <SafeMarkdown markdown={firmwareNotes} />
        </Flex>
      </ScrollView>

      <Flex height={1} backgroundColor="neutral.c40" />
      {/** TODO: replace by divider component when we have one */}
      <Flex backgroundColor="neutral.c30" p={5} mt={5} borderRadius={5}>
        <Checkbox
          checked={confirmRecoveryPhraseBackup}
          onChange={toggleConfirmRecoveryPhraseBackup}
          label={t("FirmwareUpdateReleaseNotes.confirmRecoveryPhrase")}
        />
      </Flex>
      <Button
        onPress={onContinue}
        type="main"
        mt={6}
        disabled={!confirmRecoveryPhraseBackup}
      >
        {t("common.continue")}
      </Button>
    </Flex>
  );
};

export default ConfirmRecoveryStep;
