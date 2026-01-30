import React from "react";
import { View } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";
import { Button } from "@ledgerhq/lumen-ui-rnative";

type ReviewButtonProps = Readonly<{
  label: string;
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
}>;

export function ReviewButton({ label, disabled, loading, onPress }: ReviewButtonProps) {
  const styles = useStyleSheet(
    theme => ({
      container: {
        paddingHorizontal: theme.spacings.s16,
        paddingBottom: theme.spacings.s16,
      },
    }),
    [],
  );

  return (
    <View style={styles.container}>
      <Button
        variant="base"
        size="large"
        onPress={onPress}
        disabled={disabled || loading}
        isLoading={loading}
      >
        {loading ? "" : label}
      </Button>
    </View>
  );
}
