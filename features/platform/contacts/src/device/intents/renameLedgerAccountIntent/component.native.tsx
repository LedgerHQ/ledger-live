import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { RenameLedgerAccountJobState } from "./types";

type RenameLedgerAccountComponentProps = Readonly<{
  jobState: RenameLedgerAccountJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// WIP
export function RenameLedgerAccountComponent({ jobState }: RenameLedgerAccountComponentProps) {
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
