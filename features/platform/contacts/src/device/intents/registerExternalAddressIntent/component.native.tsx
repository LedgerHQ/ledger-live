import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { RegisterExternalAddressJobState } from "./types";

type RegisterExternalAddressComponentProps = Readonly<{
  jobState: RegisterExternalAddressJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// WIP
export function RegisterExternalAddressComponent({
  jobState,
}: RegisterExternalAddressComponentProps) {
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
