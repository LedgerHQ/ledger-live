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
import { SafeAreaView } from "react-navigation";
import colors from "../colors";
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

const forceInset = { bottom: "always" };

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
    color: colors.darkBlue,
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
    color: colors.darkBlue,
    fontSize: 13,
    paddingRight: 16,
  },
  footer: {
    flexDirection: "column",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.lightFog,
  },
});

const RequireTermsModal = () => {
  const [markdown, error] = useTerms();
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
    >
      <SafeAreaView style={styles.root} forceInset={forceInset}>
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
            </View>
          ) : (
            <ActivityIndicator />
          )}
        </ScrollView>

        <View style={styles.footer}>
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
      </SafeAreaView>
    </BottomModal>
  );
};

export default RequireTermsModal;
