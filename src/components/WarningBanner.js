// @flow

import React, { PureComponent, useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import ExternalLink from "./ExternalLink";
import { urls } from "../config/urls";
import colors from "../colors";
import Touchable from "./Touchable";
import TranslatedError from "./TranslatedError";
import LText from "./LText";

const HeaderErrorTitle = ({ error }: { error: Error }) => {
  const maybeLink = error ? urls.errors[error.name] : null;
  const onOpen = useCallback(() => {
    maybeLink && Linking.openURL(maybeLink);
  }, [maybeLink]);

  return (
    <Touchable style={styles.root} onPress={maybeLink ? onOpen : null}>
      <LText style={styles.icon}>
        <Icon name="alert-octagon" size={16} color={colors.orange} />
      </LText>
      <View style={styles.container}>
        <LText secondary style={styles.description} numberOfLines={6}>
          <TranslatedError error={error} field="description" />

          {maybeLink ? (
            <ExternalLink
              event="BCH hardfork link"
              text={<Trans i18nKey="common.learnMore" />}
              color={colors.orange}
            />
          ) : null}
        </LText>
      </View>
    </Touchable>
  );
};

const styles = StyleSheet.create({
  root: {
    marginTop: 8,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 152, 79, 0.1);",
  },

  container: {},
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.orange,
  },
  icon: {
    marginRight: 8,
  },
});

export default HeaderErrorTitle;
