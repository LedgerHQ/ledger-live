import { Box, Text } from "@ledgerhq/lumen-ui-rnative";
import type { EditExternalAddressScopeJobState } from "./types";

type EditExternalAddressScopeComponentProps = Readonly<{
  jobState: EditExternalAddressScopeJobState | undefined;
  extraProps: undefined;
  onClose: () => void;
}>;

// Temporary minimal renderer until the production Contacts UI lands.
export function EditExternalAddressScopeComponent({
  jobState,
}: EditExternalAddressScopeComponentProps) {
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
