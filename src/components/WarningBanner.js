// @flow

import React, { useCallback } from "react";
import { StyleSheet, Linking } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { useTheme } from "@react-navigation/native";
import { urls } from "../config/urls";
import Touchable from "./Touchable";
import TranslatedError from "./TranslatedError";
import LText from "./LText";
import { rgba } from "../colors";

const HeaderErrorTitle = ({ error }: { error: Error }) => {
  const { colors, dark } = useTheme();
  const [backgroundColor, color] = dark
    ? [colors.orange, "#FFF"]
    : [rgba(colors.lightOrange, 0.1), colors.orange];
  const maybeLink = error ? urls.errors[error.name] : null;
  const onOpen = useCallback(() => {
    maybeLink && Linking.openURL(maybeLink);
  }, [maybeLink]);

  return (
    <Touchable
      event="WarningBanner Press"
      style={[styles.root, { backgroundColor }]}
      onPress={maybeLink ? onOpen : null}
    >
      <LText style={styles.icon}>
        <Icon name="alert-octagon" size={16} color={color} />
      </LText>
      <LText style={[styles.description, { color }]}>
        <LText style={[{ color }]} secondary>
          <TranslatedError error={error} field={"description"} />
        </LText>

        {maybeLink ? (
          <>
            {" "}
            <LText
              semiBold
              style={[styles.description, styles.learnMore, { color }]}
            >
              <Trans i18nKey="common.learnMore" />
            </LText>
          </>
        ) : null}
      </LText>
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
  },
  container: {
    display: "flex",
  },
  learnMore: {
    textDecorationLine: "underline",
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
  },
  icon: {
    marginRight: 8,
  },
});

export default HeaderErrorTitle;
