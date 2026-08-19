import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { RegisterLedgerAccountJobState } from "./types";

type RegisterLedgerAccountComponentProps = Readonly<{
  jobState: RegisterLedgerAccountJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// WIP
export function RegisterLedgerAccountComponent({ jobState }: RegisterLedgerAccountComponentProps) {
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
