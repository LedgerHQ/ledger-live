import { useState } from "react";
import { TextInput } from "react-native";
import { Box, Button, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import type { PayCardEnvVar } from "../../types";

export interface EnvVarRowProps {
  readonly envVar: PayCardEnvVar;
  readonly onSet: (key: string, value: string) => void;
}

const ROW_LX = { gap: "s2" } as const;
const INPUT_ROW_LX = { flexDirection: "row", alignItems: "center", gap: "s8" } as const;

export function EnvVarRow({ envVar, onSet }: EnvVarRowProps) {
  const { theme } = useTheme();
  // Starts on the value the tester switches to, so the other tenant is one press away.
  const [draft, setDraft] = useState(envVar.suggestedValue);

  return (
    <Box lx={ROW_LX}>
      <Text typography="body4" lx={{ color: "base" }} selectable>
        {`${envVar.key}=${envVar.value === "" ? "(empty)" : envVar.value}`}
      </Text>
      <Box lx={INPUT_ROW_LX}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          autoCapitalize="none"
          autoCorrect={false}
          testID={`pay-card-env-input-${envVar.key}`}
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: theme.colors.border.mutedSubtle,
            borderRadius: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            fontSize: 13,
            color: theme.colors.text.base,
          }}
        />
        <Button appearance="gray" size="sm" onPress={() => onSet(envVar.key, draft)}>
          Set
        </Button>
      </Box>
    </Box>
  );
}
