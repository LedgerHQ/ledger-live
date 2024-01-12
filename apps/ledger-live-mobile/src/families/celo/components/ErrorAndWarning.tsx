import React, { memo } from "react";
import { StyleProp, ViewStyle, StyleSheet, View } from "react-native";
import LText from "~/components/LText";
import TranslatedError from "~/components/TranslatedError";

const ErrorAndWarning = ({
  error,
  warning,
}: {
  error?: Error;
  warning?: Error;
  style?: StyleProp<ViewStyle>;
}) => {
  return (
    <View style={styles.errorSection}>
      {error ? (
        <>
          <LText selectable secondary semiBold style={styles.error} color="alert">
            <TranslatedError error={error} field="title" />
          </LText>
          <LText selectable secondary style={styles.error} color="alert">
            <TranslatedError error={error} field="description" />
          </LText>
        </>
      ) : warning ? (
        <>
          <LText selectable secondary semiBold style={styles.error} color="orange">
            <TranslatedError error={warning} field="title" />
          </LText>
          <LText selectable secondary style={styles.error} color="orange">
            <TranslatedError error={warning} field="description" />
          </LText>
        </>
      ) : null}
    </View>
  );
};
const styles = StyleSheet.create({
  error: {
    textAlign: "center",
  },
  errorSection: {
    padding: 16,
    height: 80,
  },
});

export default memo(ErrorAndWarning);
