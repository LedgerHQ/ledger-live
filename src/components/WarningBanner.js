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

const HeaderErrorTitle = ({ error }: { error: Error }) => {
  const { colors } = useTheme();
  const maybeLink = error ? urls.errors[error.name] : null;
  const onOpen = useCallback(() => {
    maybeLink && Linking.openURL(maybeLink);
  }, [maybeLink]);

  return (
    <Touchable
      event="WarningBanner Press"
      style={styles.root}
      onPress={maybeLink ? onOpen : null}
    >
      <LText style={styles.icon}>
        <Icon name="alert-octagon" size={16} color={colors.orange} />
      </LText>
      <LText style={styles.description}>
        <LText secondary>
          <TranslatedError error={error} field={"description"} />
        </LText>

        {maybeLink ? (
          <>
            {" "}
            <LText
              semiBold
              style={[styles.description, styles.learnMore]}
              color="orange"
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
    backgroundColor: "rgba(255, 152, 79, 0.1);",
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
