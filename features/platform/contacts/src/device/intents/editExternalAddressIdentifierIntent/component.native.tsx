import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { EditExternalAddressIdentifierJobState } from "./types";

type EditExternalAddressIdentifierComponentProps = Readonly<{
  jobState: EditExternalAddressIdentifierJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// WIP
export function EditExternalAddressIdentifierComponent({
  jobState,
}: EditExternalAddressIdentifierComponentProps) {
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
