import { Box, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";

type MiniTagProps = Readonly<{
  label: string;
  backgroundColor?: string;
  color?: string;
}>;

export function MiniTag({ label, backgroundColor, color }: MiniTagProps) {
  const { theme } = useTheme();
  return (
    <Box
      lx={{ paddingHorizontal: "s6", paddingVertical: "s2", borderRadius: "sm" }}
      style={{ backgroundColor: backgroundColor ?? theme.colors.bg.muted }}
    >
      <Text typography="body4SemiBold" style={{ color: color ?? theme.colors.text.base }}>
        {label}
      </Text>
    </Box>
  );
}
