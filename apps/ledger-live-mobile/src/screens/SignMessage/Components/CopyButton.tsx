import React, { useState, useCallback } from "react";
import { StyleSheet, View } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { Button, Icons, Text } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import { useTranslation } from "react-i18next";

type Props = {
  readonly text: string;
};

function CopyButton({ text }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const theme = useTheme();

  const handleCopy = useCallback(() => {
    const textToCopy = text;
    Clipboard.setString(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }, [text]);

  const buttonBackgroundColor =
    theme.colors.type === "dark" ? theme.colors.primary.c20 : theme.colors.primary.c30;

  return (
    <Button
      type="shade"
      onPress={handleCopy}
      style={[styles.buttonContainer, { backgroundColor: buttonBackgroundColor }]}
      testID="copy-button"
    >
      <View style={styles.contentWrapper} testID="copy-wrapper">
        {copied ? (
          <>
            <Icons.Check size="S" color="success.c50" />
            <Text style={styles.text} color="neutral.c90">
              {t("common.copied")}
            </Text>
          </>
        ) : (
          <>
            <Icons.Copy size="S" color="neutral.c90" />
            <Text style={styles.text} color="neutral.c90">
              {t("common.copy")}
            </Text>
          </>
        )}
      </View>
    </Button>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: "absolute",
    width: 120,
    left: "35%",
    bottom: 20,
    height: 36,
  },
  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 5,
  },
  text: {
    fontSize: 14,
    paddingLeft: 8,
  },
});

export default React.memo(CopyButton);
