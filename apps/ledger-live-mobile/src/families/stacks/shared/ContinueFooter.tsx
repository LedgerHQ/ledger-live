import React from "react";
import { View } from "react-native";
import { Button, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import TranslatedError from "~/components/TranslatedError";
import { stacksFlowStyles as styles } from "./styles";

type Props = Readonly<{
  bridgeError: Error | null | undefined;
  onContinue: () => void;
  disabled: boolean;
  pending: boolean;
  testID: string;
}>;

export default function ContinueFooter({
  bridgeError,
  onContinue,
  disabled,
  pending,
  testID,
}: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.footer}>
      {/* Not gated on `pending`: useBridgeTransaction keeps `bridgePending` true for as long as a
          failed preparation is being retried, so the error and the spinner show together. */}
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
