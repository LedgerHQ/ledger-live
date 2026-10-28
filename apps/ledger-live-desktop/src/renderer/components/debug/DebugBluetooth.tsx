import React from "react";
import styled from "styled-components";
import { useBluetoothActivity } from "@ledgerhq/live-dmk-desktop";
import Box from "~/renderer/components/Box";

const SUCCESS_STATUS_WORD = "9000";

const Item = styled.div<{ healthy: boolean }>`
  padding: 2px 13px;
  min-height: 22px;
  font-size: 11px;
  color: white;
  background: ${p => (p.healthy ? p.theme.colors.positiveGreen : p.theme.colors.alertRed)};
  opacity: 0.9;
`;

/** Debug badge (DEBUG_BLE): shows that the device receives and answers over Bluetooth. */
const DebugBluetooth = () => {
  const {
    deviceName,
    isConnected,
    apdusSent,
    responsesReceived,
    lastStatusWord,
    lastExchangeAt,
    lastError,
  } = useBluetoothActivity();
  const healthy =
    isConnected && !lastError && (lastStatusWord ?? SUCCESS_STATUS_WORD) === SUCCESS_STATUS_WORD;
  const connection = isConnected ? `${deviceName} connected` : "not connected";
  const lastExchange = lastExchangeAt ? ` @ ${lastExchangeAt.toLocaleTimeString()}` : "";
  const lastResult = lastError ? `error ${lastError}` : `SW ${lastStatusWord ?? "-"}`;

  return (
    <Box p={0} horizontal>
      <Item healthy={healthy}>
        {`BLE ● ${connection} · APDU ↑${apdusSent} ↓${responsesReceived} · ${lastResult}${lastExchange}`}
      </Item>
    </Box>
  );
};

export default DebugBluetooth;
