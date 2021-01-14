// @flow

import React, { useCallback, useState } from "react";
import { StyleSheet, View, Linking, ActivityIndicator } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import CheckBox from "../../../components/CheckBox";
import { NavigatorName, ScreenName } from "../../../const";

import { useTerms, useTermsAccept, url } from "../../../logic/terms";
import SafeMarkdown from "../../../components/SafeMarkdown";
import ExternalLink from "../../../components/ExternalLink";
import Touchable from "../../../components/Touchable";
import GenericErrorView from "../../../components/GenericErrorView";
import RetryButton from "../../../components/RetryButton";
import AnimatedHeaderView from "../../../components/AnimatedHeader";

import { urls } from "../../../config/urls";

function OnboardingStepTerms({ navigation }: *) {
  const { colors } = useTheme();
  const [markdown, error, retry] = useTerms();
  const [, accept] = useTermsAccept();
  const [toggle, setToggle] = useState(false);
  const [togglePrivacy, setTogglePrivacy] = useState(false);
  const onSwitch = useCallback(() => {
    setToggle(!toggle);
  }, [toggle]);

  const onSwitchPrivacy = useCallback(() => {
    setTogglePrivacy(!togglePrivacy);
  }, [togglePrivacy]);

  const next = useCallback(() => {
    accept();
    navigation.navigate(NavigatorName.Onboarding, {
      screen: ScreenName.OnboardingDeviceSelection,
    });
  }, [accept, navigation]);

  return (
    <AnimatedHeaderView
      hasBackButton
      title={<Trans i18nKey="Terms.title" />}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.lightFog }]}>
          <Touchable
            event="TermsAcceptSwitch"
            onPress={onSwitch}
            style={[styles.switchRow]}
          >
            <CheckBox style={styles.checkbox} isChecked={toggle} />
            <LText semiBold style={styles.switchLabel}>
              <Trans i18nKey="Terms.switchLabel">
                {""}
                <LText
                  semiBold
                  onPress={() => Linking.openURL(urls.terms)}
                  color="live"
                />
                {""}
              </Trans>
            </LText>
          </Touchable>
          <Touchable
            event="TermsAcceptSwitchPrivacy"
            onPress={onSwitchPrivacy}
            style={styles.switchRow}
          >
            <CheckBox style={styles.checkbox} isChecked={togglePrivacy} />
            <LText semiBold style={styles.switchLabel}>
              <Trans i18nKey="Terms.switchLabelPrivacy">
                {""}
                <LText
                  semiBold
                  onPress={() => Linking.openURL(urls.privacyPolicy)}
                  color="live"
                />
                {""}
              </Trans>
            </LText>
          </Touchable>
          <Button
            event="Onboarding - ToU accepted"
            type="primary"
            disabled={!toggle || !togglePrivacy}
            onPress={next}
            title={<Trans i18nKey="Terms.cta" />}
          />
        </View>
      }
    >
      <TrackScreen category="Onboarding" name="Terms" />
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
    </AnimatedHeaderView>
  );
}

const styles = StyleSheet.create({
  switchRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 12,
    marginBottom: 12,
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

    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  footerClose: {
    marginTop: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  checkbox: {
    borderRadius: 4,
    width: 22,
    height: 22,
  },
});

export default OnboardingStepTerms;
