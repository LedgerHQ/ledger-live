import React, { memo, useCallback } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import TranslatedError from "~/components/TranslatedError";
import SupportLinkError from "~/components/SupportLinkError";
import LText from "~/components/LText";
import RecipientInput from "~/components/RecipientInput";

type Props = {
  onChangeText: (value: string) => void;
  onRecipientFieldFocus: () => void;
  transaction: Transaction;
  warning?: Error | null;
  error?: Error | null;
};

const RecipientRow = ({
  onChangeText,
  onRecipientFieldFocus,
  transaction,
  warning,
  error,
}: Props) => {
  const onPaste = useCallback(() => {
    Clipboard.getString().then(text => {
      onChangeText(text);
    });
  }, [onChangeText]);

  return (
    <>
      <View style={styles.inputWrapper}>
        <RecipientInput
          onPaste={onPaste}
          onFocus={onRecipientFieldFocus}
          onChangeText={onChangeText}
          value={transaction.recipient}
        />
      </View>
      {(error || warning) && (
        <>
          <LText
            style={[styles.warningBox]}
            color={error ? "alert" : warning ? "orange" : "darkBlue"}
          >
            <TranslatedError error={error || warning} />
          </LText>
          <View
            style={{
              display: "flex",
              alignItems: "flex-start",
            }}
          >
            <SupportLinkError error={error} type="alert" />
          </View>
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  warningBox: {
    marginTop: 8,
    ...Platform.select({
      android: {
        marginLeft: 6,
      },
    }),
  },
  inputWrapper: {
    marginTop: 32,
    flexDirection: "row",
    alignItems: "center",
  },
});

export default memo(RecipientRow);
