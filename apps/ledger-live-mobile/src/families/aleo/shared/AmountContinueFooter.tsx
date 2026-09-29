import React from "react";
import { View } from "react-native";
import { Button, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import TranslatedError from "~/components/TranslatedError";
import { amountStyles as styles } from "./amountStyles";

type Props = Readonly<{
  bridgeError: Error | null | undefined;
  onContinue: () => void;
  disabled: boolean;
  pending: boolean;
  testID: string;
}>;

export default function AmountContinueFooter({
  bridgeError,
  onContinue,
  disabled,
  pending,
  testID,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.footer}>
      {bridgeError && (
        <Text variant="small" color="error.c60" textAlign="center" mb={3}>
          <TranslatedError error={bridgeError} />
        </Text>
      )}
      <Button
        type="main"
        size="large"
        onPress={onContinue}
        disabled={disabled}
        pending={pending}
        testID={testID}
      >
        {t("common.continue")}
      </Button>
    </View>
  );
}
