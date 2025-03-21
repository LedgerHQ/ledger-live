import { Button, Flex, IconsLegacy } from "@ledgerhq/native-ui";
import { BleError } from "@ledgerhq/live-common/ble/types";
import { Trans } from "react-i18next";
import React from "react";
import GenericErrorView from "~/components/GenericErrorView";

export const BleDevicePeerRemoved = ({
  pairingError,
  onOpenHelp,
  onRetry,
}: {
  pairingError: BleError;
  onOpenHelp: () => void;
  onRetry: () => void;
}) => (
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
      <Button type="main" onPress={onRetry} mt={6}>
        <Trans i18nKey="common.retry" />
      </Button>
      <Button
        iconPosition="right"
        Icon={IconsLegacy.ExternalLinkMedium}
        onPress={onOpenHelp}
        mb={0}
      >
        <Trans i18nKey="help.helpCenter.desc" />
      </Button>
    </Flex>
  </Flex>
);
