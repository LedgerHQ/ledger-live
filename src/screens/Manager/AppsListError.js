/* @flow */
import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import GenericErrorView from "../../components/GenericErrorView";
import RetryButton from "../../components/RetryButton";

export default class AppsListError extends PureComponent<{
  error: Error,
  onRetry: () => *,
}> {
  render() {
    const { error, onRetry } = this.props;
    return (
      <View style={styles.root}>
        <GenericErrorView big error={error} />
        <RetryButton onPress={onRetry} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "center",
  },
});
