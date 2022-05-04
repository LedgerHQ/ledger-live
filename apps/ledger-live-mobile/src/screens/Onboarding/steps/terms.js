// @flow

import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { StyleSheet, View, Linking } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import CheckBox from "../../../components/CheckBox";
import { NavigatorName, ScreenName } from "../../../const";
import { setAnalytics } from "../../../actions/settings";

import { useTermsAccept } from "../../../logic/terms";
import ExternalLink from "../../../components/ExternalLink";
import Touchable from "../../../components/Touchable";
import AnimatedHeaderView from "../../../components/AnimatedHeader";

import { useLocale } from "../../../context/Locale";

import { urls } from "../../../config/urls";
import ArrowRight from "../../../icons/ArrowRight";

type LinkBoxProps = {
  style?: ViewStyleProp,
  text: React$Node,
  url: string,
  event: string,
};

const LinkBox = React.memo(({ style, text, url, event }: LinkBoxProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={[style, styles.linkBox, { backgroundColor: colors.lightLive }]}
    >
      <ExternalLink
        text={text}
        onPress={() => Linking.openURL(url)}
        event={event}
        style={styles.linkBoxLink}
        fontSize={14}
      />
    </View>
  );
});

function OnboardingStepTerms({ navigation }: *) {
  const { colors } = useTheme();
  const { locale } = useLocale();
  const dispatch = useDispatch();
  const [, accept] = useTermsAccept();
  const [toggle, setToggle] = useState(false);

  const onSwitch = useCallback(() => {
    setToggle(!toggle);
  }, [toggle]);

  const next = useCallback(() => {
    accept();
    dispatch(setAnalytics(true));
    navigation.navigate(NavigatorName.Onboarding, {
      screen: ScreenName.OnboardingDeviceSelection,
    });
  }, [accept, dispatch, navigation]);

  return (
    <AnimatedHeaderView
      hasBackButton
      title={<Trans i18nKey="Terms.title" />}
      footer={
        <View style={[styles.footer, { borderTopColor: colors.lightFog }]}>
          <Touchable
            event="TermsAcceptSwitch"
            onPress={onSwitch}
            style={styles.switchRow}
          >
            <>
              <CheckBox style={styles.checkbox} isChecked={toggle} />
              <LText semiBold style={styles.switchLabel}>
                <Trans i18nKey="Terms.switchLabelFull" />
              </LText>
            </>
          </Touchable>
          <Button
            event="Onboarding - ToU accepted"
            type="primary"
            disabled={!toggle}
            onPress={next}
            title={<Trans i18nKey="Terms.cta" />}
            IconRight={ArrowRight}
          />
        </View>
      }
    >
      <TrackScreen category="Onboarding" name="Terms" />
      <LinkBox
        style={styles.linkBoxSpacing}
        text={<Trans i18nKey="Terms.service" />}
        url={urls.terms[locale || "en"]}
        event="OpenTerms"
      />
      <LinkBox
        text={<Trans i18nKey="settings.about.privacyPolicy" />}
        url={urls.privacyPolicy[locale || "en"]}
        event="OpenPrivacyPolicy"
      />
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
    lineHeight: 20,
  },
  footer: {
    flexDirection: "column",
    justifyContent: "space-between",
    // borderTopWidth: 1,
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
  linkBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 4,
  },
  linkBoxLink: { flex: 1, justifyContent: "space-between" },
  linkBoxSpacing: {
    marginBottom: 16,
  },
});

export default OnboardingStepTerms;
