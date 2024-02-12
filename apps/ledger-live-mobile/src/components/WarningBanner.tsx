import React from "react";
import { StyleSheet, View } from "react-native";
import { urls } from "~/utils/urls";
import TranslatedError from "./TranslatedError";
import Alert from "./Alert";

const WarningBanner = ({ error }: { error: Error }) => {
  const maybeUrl = error ? urls.errors[error.name as keyof typeof urls.errors] : undefined;
  return (
    <View style={styles.root}>
      <Alert type="update" learnMoreUrl={maybeUrl}>
        <TranslatedError error={error} field={"description"} />
      </Alert>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginTop: 8,
    marginHorizontal: 16,
  },
});
export default WarningBanner;
