import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { EditExternalAddressJobState } from "./types";

type EditExternalAddressComponentProps = Readonly<{
  jobState: EditExternalAddressJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// WIP
export function EditExternalAddressComponent({ jobState }: EditExternalAddressComponentProps) {
  const message =
    jobState === undefined
      ? "Preparing Contacts operation"
      : jobState.type === "awaiting-device-confirmation"
        ? `Confirm ${jobState.step} on your Ledger`
        : jobState.type;

  return (
    <Box lx={{ gap: "s8", padding: "s16" }}>
      <Text typography="body2" lx={{ color: "base" }}>
        {message}
      </Text>
    </Box>
  );
}
