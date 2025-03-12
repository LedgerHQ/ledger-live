import { Button, Flex } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import ExternalLink from "~/components/ExternalLink";
import React from "react";
import { useTranslation } from "react-i18next";

export const BleDeviceLocked = ({
  onRetry,
  onOpenHelp,
  productName,
}: {
  onRetry: () => void;
  onOpenHelp: () => void;
  productName: string;
}) => {
  const { t } = useTranslation();
  return (
    <Flex flex={1} mb={6}>
      <TrackScreen category="BT failed to pair" />
      <Flex flex={1} alignItems="center" justifyContent="center">
        <GenericInformationBody
          title={t("blePairingFlow.pairing.error.generic.title")}
          description={t("blePairingFlow.pairing.error.generic.subtitle", {
            productName,
          })}
        />
      </Flex>
      <Button type="main" size="large" onPress={onRetry} mb={7}>
        {t("blePairingFlow.pairing.error.retryCta")}
      </Button>
      <ExternalLink
        type="main"
        text={t("blePairingFlow.pairing.error.howToFixPairingIssue")}
        onPress={onOpenHelp}
      />
    </Flex>
  );
};
