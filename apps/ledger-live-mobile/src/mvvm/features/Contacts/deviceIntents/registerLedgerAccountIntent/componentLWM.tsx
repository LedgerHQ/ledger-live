import React from "react";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { RegisterLedgerAccountJobState } from "@features/platform-contacts/device/intents";

type RegisterLedgerAccountComponentLWMProps = Readonly<{
  jobState: RegisterLedgerAccountJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// Temporary minimal renderer until the production Contacts UI lands.
export function RegisterLedgerAccountComponentLWM({
  jobState,
}: RegisterLedgerAccountComponentLWMProps) {
  const message =
    jobState === undefined
      ? "Preparing Contacts operation"
      : jobState.type === "awaiting-device-confirmation"
        ? "Confirm on your Ledger"
        : jobState.type;

  return (
    <Box lx={{ gap: "s8", padding: "s16" }}>
      <Text typography="body2" lx={{ color: "base" }}>
        {message}
      </Text>
    </Box>
  );
}
