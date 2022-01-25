// @flow

import React, { useCallback, memo } from "react";

import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import WarningBox from "../../../components/WarningBox";
import { NavigatorName, ScreenName } from "../../../const";

function RecoveryPhraseWarning() {
  const navigation = useNavigation();

  const onLearnMoreWarning = useCallback(() => {
    navigation.navigate(NavigatorName.Onboarding, {
      screen: ScreenName.OnboardingInfoModal,
      params: {
        sceneInfoKey: "recoveryWarningInfoModalProps",
      },
    });
  }, [navigation]);

  return (
    <View style={[styles.warnbox]}>
      <WarningBox onLearnMore={onLearnMoreWarning}>
        <Trans i18nKey="onboarding.warning.recoveryPhrase.title" />
      </WarningBox>
    </View>
  );
}

const styles = StyleSheet.create({
  warnbox: { marginVertical: 8, backgroundColor: "#FFF", borderRadius: 8 },
});

export default memo<*>(RecoveryPhraseWarning);
