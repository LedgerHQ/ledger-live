import { Box, Text, Switch } from "@ledgerhq/lumen-ui-rnative";

export interface ToggleRowProps {
  readonly label: string;
  readonly description?: string;
  readonly checked: boolean;
  readonly onChange: (value: boolean) => void;
}

const ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 16,
} as const;

export function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <Box style={ROW_LX}>
      <Box style={{ flexShrink: 1 }}>
        <Text typography="body3" lx={{ color: "base" }}>
          {label}
        </Text>
        {description ? (
          <Text typography="body4" lx={{ color: "muted" }}>
            {description}
          </Text>
        ) : null}
      </Box>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Box>
  );
}
