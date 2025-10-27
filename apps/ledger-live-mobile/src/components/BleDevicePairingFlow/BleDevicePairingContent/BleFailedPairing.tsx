import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { GenericInformationBody } from "~/components/GenericInformationBody";
import ExternalLink from "~/components/ExternalLink";

type Props = {
  productName: string;
  onRetry: () => void;
  onOpenHelp: () => void;
};

/**
 * Displayed when a generic error happens during a BLE pairing.
 * Proposes to retry or open help center.
 */
export function BleFailedPairing({ productName, onRetry, onOpenHelp }: Readonly<Props>) {
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
      <Button type="main" size="large" mb={24} mx={16} onPress={onRetry}>
        {t("blePairingFlow.pairing.error.retryCta")}
      </Button>
      <ExternalLink
        type="main"
        text={t("blePairingFlow.pairing.error.howToFixPairingIssue")}
        onPress={onOpenHelp}
      />
    </Flex>
  );
}
