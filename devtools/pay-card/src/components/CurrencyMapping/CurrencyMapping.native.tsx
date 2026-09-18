import { ScrollView } from "react-native";
import { Box, Button, Divider, Text } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardCurrencyMappingRow } from "../../types";
import { Section } from "../Section/Section";

export interface CurrencyMappingScreenProps {
  readonly rows: readonly PayCardCurrencyMappingRow[];
  readonly onBack: () => void;
}

// Fixed, so the header keeps sitting over its column while the table scrolls sideways. A Ledger
// token id is long, and truncating it would hide the half that tells two tokens apart.
const KEY_WIDTH = "s176";
const LEDGER_ID_WIDTH = "s320";

const HEADER_LX = { padding: "s16" } as const;
const ROW_LX = { flexDirection: "row", gap: "s12", paddingVertical: "s4" } as const;

function Cell({
  value,
  width,
  muted = false,
}: {
  readonly value: string;
  readonly width: typeof KEY_WIDTH | typeof LEDGER_ID_WIDTH;
  readonly muted?: boolean;
}) {
  return (
    <Box lx={{ width }}>
      <Text typography="body3" lx={{ color: muted ? "muted" : "base" }}>
        {value}
      </Text>
    </Box>
  );
}

export function CurrencyMappingScreen({ rows, onBack }: CurrencyMappingScreenProps) {
  return (
    <Box lx={{ flex: 1 }}>
      <Box lx={HEADER_LX}>
        <Button appearance="gray" size="sm" onPress={onBack}>
          Back
        </Button>
      </Box>

      <Section title="Currency Mapping">
        <Text typography="body3" lx={{ color: "muted" }}>
          {`${rows.length} pairs. An asset answered with a pair absent here resolves to nothing.`}
        </Text>

        {/* Horizontal outside, vertical inside: the header scrolls sideways with its columns and
            stays put while the rows scroll down. */}
        <ScrollView horizontal>
          <Box>
            <Box lx={ROW_LX}>
              <Cell value="currency.network" width={KEY_WIDTH} muted />
              <Cell value="ledgerId" width={LEDGER_ID_WIDTH} muted />
            </Box>
            <Divider />
            <ScrollView>
              {rows.map(({ key, ledgerId }) => (
                <Box key={key} lx={ROW_LX}>
                  <Cell value={key} width={KEY_WIDTH} />
                  <Cell value={ledgerId} width={LEDGER_ID_WIDTH} />
                </Box>
              ))}
            </ScrollView>
          </Box>
        </ScrollView>
      </Section>
    </Box>
  );
}
