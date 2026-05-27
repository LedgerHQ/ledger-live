import React from "react";
import { StyleSheet, TextInput } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Box, Text } from "@ledgerhq/lumen-ui-rnative";

type GenericAwarenessModalFieldProps = Readonly<{
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  multiline?: boolean;
}>;

export function GenericAwarenessModalField({
  label,
  value,
  onChangeText,
  multiline,
}: GenericAwarenessModalFieldProps) {
  const { colors } = useTheme();

  return (
    <Box lx={{ marginBottom: "s12" }}>
      <Text typography="body2SemiBold" lx={{ color: "base", marginBottom: "s8" }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            color: colors.text,
          },
        ]}
      />
    </Box>
  );
}

const styles = StyleSheet.create({
  input: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multilineInput: {
    minHeight: 76,
    textAlignVertical: "top",
  },
});
