import React from "react";
import { Trans } from "react-i18next";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import Box from "~/renderer/components/Box";
import Button from "~/renderer/components/Button";
import Text from "~/renderer/components/Text";
import { canConnectWithBluetooth } from "./canConnectWithBluetooth";
import { BLUETOOTH_STATUS_MESSAGE_KEYS, useConnectBluetooth } from "./useConnectBluetooth";

type Props = {
  deviceModelId: DeviceModelId;
};

/**
 * Connects a Ledger over Bluetooth. Once connected, the device joins the regular device flow,
 * so the surrounding device action continues on its own. Renders nothing when Bluetooth is
 * disabled or the model has none, without touching the DMK.
 */
export const ConnectBluetoothButton = ({ deviceModelId }: Props) =>
  canConnectWithBluetooth([deviceModelId]) ? <ConnectBluetoothButtonContent /> : null;

const ConnectBluetoothButtonContent = () => {
  const { status, connect } = useConnectBluetooth();
  const isSearching = status === "searching";
  const messageKey = BLUETOOTH_STATUS_MESSAGE_KEYS[status];

  return (
    <Box alignItems="center" mt={4}>
      <Button primary onClick={connect} isLoading={isSearching} disabled={isSearching}>
        <Trans i18nKey="bluetooth.connect.cta" />
      </Button>
      {messageKey ? (
        <Text mt={2} ff="Inter|Regular" fontSize={3} color="neutral.c70" textAlign="center">
          <Trans i18nKey={messageKey} />
        </Text>
      ) : null}
    </Box>
  );
};
