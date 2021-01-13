/* @flow */

import React, { useCallback, useState } from "react";
import { Trans } from "react-i18next";
import {
  StyleSheet,
  View,
  ScrollView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useTerms, useTermsAccept, url } from "../logic/terms";
import getWindowDimensions from "../logic/getWindowDimensions";
import LText from "./LText";
import SafeMarkdown from "./SafeMarkdown";
import Button from "./Button";
import BottomModal from "./BottomModal";
import ExternalLink from "./ExternalLink";
import CheckBox from "./CheckBox";
import Touchable from "./Touchable";
import GenericErrorView from "./GenericErrorView";
import RetryButton from "./RetryButton";

const styles = StyleSheet.create({
  modal: {},
  root: {
    paddingTop: 0,
    padding: 16,
  },
  header: {
    paddingVertical: 16,
  },
  title: {
    textAlign: "center",

    fontSize: 16,
  },
  body: {},
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  switchLabel: {
    marginLeft: 8,

    fontSize: 13,
    paddingRight: 16,
  },
  footer: {
    flexDirection: "column",
    justifyContent: "space-between",
    borderTopWidth: 1,
  },
  footerClose: {
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
  },
});

const RequireTermsModal = () => {
  const { colors } = useTheme();
  const [markdown, error, retry] = useTerms();
  const [accepted, accept] = useTermsAccept();
  const [toggle, setToggle] = useState(false);
  const onSwitch = useCallback(() => {
    setToggle(!toggle);
  }, [toggle]);

  const height = getWindowDimensions().height - 320;

  return (
    <BottomModal
      id="RequireTermsModal"
      isOpened={!accepted}
      style={styles.modal}
      preventBackdropClick
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <LText semiBold style={styles.title}>
            <Trans i18nKey="Terms.title" />
          </LText>
        </View>

        <ScrollView style={[styles.body, { height }]}>
          {markdown ? (
            <SafeMarkdown markdown={markdown} />
          ) : error ? (
            <View>
              <GenericErrorView
                error={error}
                withIcon={false}
                withDescription={false}
              />
              <ExternalLink
                text={<Trans i18nKey="Terms.read" />}
                onPress={() => Linking.openURL(url)}
                event="OpenTerms"
              />
              <View style={styles.retryButton}>
                <RetryButton onPress={retry} />
              </View>
            </View>
          ) : (
            <ActivityIndicator />
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.lightFog }]}>
          <Touchable
            event="TermsAcceptSwitch"
            onPress={onSwitch}
            style={styles.switchRow}
          >
            <CheckBox isChecked={toggle} />
            <LText semiBold style={styles.switchLabel}>
              <Trans i18nKey="Terms.switchLabel" />
            </LText>
          </Touchable>

          <Button
            event="TermsConfirm"
            type="primary"
            disabled={!toggle}
            onPress={accept}
            title={<Trans i18nKey="common.confirm" />}
          />
        </View>
      </View>
    </BottomModal>
  );
};

export default RequireTermsModal;

export const TermModals = ({
  isOpened,
  close,
}: {
  isOpened: boolean,
  close: () => void,
}) => {
  const { colors } = useTheme();
  const [markdown, error, retry] = useTerms();
  const height = getWindowDimensions().height - 320;

  const onClose = useCallback(() => {
    close();
  }, [close]);

  return (
    <BottomModal
      id="TermsModal"
      isOpened={isOpened}
      style={styles.modal}
      preventBackdropClick
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <LText semiBold style={styles.title}>
            <Trans i18nKey="Terms.title" />
          </LText>
        </View>

        <ScrollView style={[styles.body, { height }]}>
          {markdown ? (
            <SafeMarkdown markdown={markdown} />
          ) : error ? (
            <View>
              <GenericErrorView
                error={error}
                withIcon={false}
                withDescription={false}
              />
              <ExternalLink
                text={<Trans i18nKey="Terms.read" />}
                onPress={() => Linking.openURL(url)}
                event="OpenTerms"
              />
              <View style={styles.retryButton}>
                <RetryButton onPress={retry} />
              </View>
            </View>
          ) : (
            <ActivityIndicator />
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { borderTopColor: colors.lightFog },
            styles.footerClose,
          ]}
        >
          <Button
            event="TermsClose"
            type="primary"
            onPress={onClose}
            title={<Trans i18nKey="common.close" />}
          />
        </View>
      </View>
    </BottomModal>
  );
};
