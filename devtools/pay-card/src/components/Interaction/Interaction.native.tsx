import { ScrollView } from "react-native";
import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardInteractionProps } from "../../types";

export interface InteractionProps extends PayCardInteractionProps {
  readonly onBack: () => void;
}

const CONTAINER_LX = { gap: "s12", padding: "s16" } as const;
const PROBE_LX = { gap: "s8" } as const;
const BUTTON_ROW_LX = { flexDirection: "row", flexWrap: "wrap", gap: "s8" } as const;

export function Interaction({ probes, onBack }: InteractionProps) {
  return (
    <ScrollView>
      <Box lx={CONTAINER_LX}>
        <Box lx={BUTTON_ROW_LX}>
          <Button appearance="gray" size="sm" onPress={onBack}>
            Back
          </Button>
        </Box>

        {probes.map(probe => (
          <Box key={probe.id} lx={PROBE_LX}>
            <Box lx={BUTTON_ROW_LX}>
              <Button appearance="accent" size="sm" loading={probe.isFetching} onPress={probe.run}>
                {probe.label}
              </Button>
            </Box>
            {probe.error === undefined ? null : (
              <Text typography="body3" lx={{ color: "error" }}>
                {probe.error}
              </Text>
            )}
            {probe.result === undefined ? null : (
              <Text typography="body3" lx={{ color: "muted" }}>
                {probe.result}
              </Text>
            )}
          </Box>
        ))}
      </Box>
    </ScrollView>
  );
}
