import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Flex } from "@ledgerhq/native-ui";
import { BleError } from "@ledgerhq/live-common/ble/types";
import GenericErrorView from "~/components/GenericErrorView";
import ExternalLink from "~/components/ExternalLink";

type Props = {
  pairingError: BleError;
  onOpenHelp: () => void;
  onRetry: () => void;
};

/**
 * Displayed when a PeerRemovedPairing error happens during a BLE pairing.
 * Proposes to retry or open help center.
 */
export function BleDevicePeerRemoved({ pairingError, onOpenHelp, onRetry }: Readonly<Props>) {
  const { t } = useTranslation();
  return (
    <Flex flex={1} justifyContent="space-between">
      <Flex flex={1} justifyContent="center">
        <GenericErrorView
          error={pairingError}
          withDescription
          hasExportLogButton={false}
          withHelp={false}
        />
      </Flex>
      <Flex mt={30} flexDirection="column" style={{ width: "100%" }}>
        <Button type="main" size="large" mb={24} mx={16} onPress={onRetry}>
          {t("common.retry")}
        </Button>
        <ExternalLink type="main" text={t("help.helpCenter.desc")} onPress={onOpenHelp} />
      </Flex>
    </Flex>
  );
}
