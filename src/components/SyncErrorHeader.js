// @flow

import React, { PureComponent } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import { translate } from "react-i18next";
import colors from "../colors";
import LText from "./LText";
import TranslatedError from "./TranslatedError";

class SyncErrorHeader extends PureComponent<{
  error: ?Error,
  onPress: () => void,
  t: *,
}> {
  render() {
    const { error, t, onPress } = this.props;
    return (
      <TouchableWithoutFeedback onPress={onPress}>
        <View style={styles.root}>
          <SafeAreaView>
            <View style={styles.body}>
              <LText bold style={styles.title}>
                {t("portfolio.syncFailed")}
              </LText>
              <LText style={styles.description} numberOfLines={2}>
                <TranslatedError error={error} />
              </LText>
            </View>
          </SafeAreaView>
        </View>
      </TouchableWithoutFeedback>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.errorBg,
  },
  body: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  title: {
    color: colors.white,
  },
  description: {
    color: colors.white,
  },
});

export default translate()(SyncErrorHeader);
