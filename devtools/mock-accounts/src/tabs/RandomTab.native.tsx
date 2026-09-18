import { Box, Button } from "@ledgerhq/lumen-ui-rnative";

const PICKS = ["1", "2", "5", "10", "25", "50", "100"] as const;

interface Props {
  onGenerate: (count: number) => void;
}

export function RandomTab({ onGenerate }: Props) {
  return (
    <Box style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {PICKS.map(n => (
        <Button key={n} appearance="gray" size="sm" onPress={() => onGenerate(Number(n))}>
          {n}
        </Button>
      ))}
    </Box>
  );
}
