// @flow

import React, { PureComponent } from "react";
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  SafeAreaView,
} from "react-native";
import { translate } from "react-i18next";
import colors from "../../colors";
import LText from "../../components/LText";
import TranslatedError from "../../components/TranslatedError";
import StyledStatusBar from "../../components/StyledStatusBar";
import { scrollToTopIntent } from "./events";

class SyncErrorHeader extends PureComponent<{
  error: ?Error,
  t: *,
}> {
  onPress = () => {
    scrollToTopIntent.next();
  };
  render() {
    const { error, t } = this.props;
    return (
      <TouchableWithoutFeedback onPress={this.onPress}>
        <View style={styles.root}>
          <StyledStatusBar backgroundColor={colors.errorBg} />
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
