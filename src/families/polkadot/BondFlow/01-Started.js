// @flow
import React, { useCallback } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Linking,
  SafeAreaView,
} from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName } from "../../../const";
import { TrackScreen } from "../../../analytics";
import Button from "../../../components/Button";
import LText from "../../../components/LText";
import ExternalLink from "../../../components/ExternalLink";
import BulletList, { BulletGreenCheck } from "../../../components/BulletList";
import VerifyAddressDisclaimer from "../../../components/VerifyAddressDisclaimer";
import IlluRewards from "../../../icons/images/Rewards";
import { urls } from "../../../config/urls";

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {};

export default function PolkadotBondStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.PolkadotBondAmount, route.params);
  }, [navigation, route.params]);

  const onCancel = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  const onHelp = useCallback(() => {
    Linking.openURL(urls.polkadotStaking);
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="BondFlow" name="Started" />
        <IlluRewards />
        <LText secondary style={styles.description}>
          <Trans i18nKey="polkadot.bond.steps.starter.description" />
        </LText>
        <BulletList
          style={styles.bulletList}
          itemContainerStyle={styles.bulletItemContainer}
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="polkadot.bond.steps.starter.bullet.0" />,
            <Trans i18nKey="polkadot.bond.steps.starter.bullet.1" />,
            <Trans i18nKey="polkadot.bond.steps.starter.bullet.2" />,
          ].map(wording => (
            <LText secondary semiBold style={styles.bulletItem}>
              {wording}
            </LText>
          ))}
        />
        <View
          style={[
            styles.help,
            {
              borderColor: colors.live,
            },
          ]}
        >
          <ExternalLink
            event="PolkadotBondStartedHelp"
            onPress={onHelp}
            text={<Trans i18nKey="polkadot.bond.steps.starter.help" />}
            ltextProps={{
              secondary: true,
            }}
          />
        </View>
        <View style={styles.warning}>
          <VerifyAddressDisclaimer
            text={<Trans i18nKey="polkadot.bond.steps.starter.warning" />}
            verified
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          event="PolkadotBondStartedBtn"
          onPress={onNext}
          title={<Trans i18nKey="common.continue" />}
          type="primary"
        />
        <Button
          event="PolkadotBondStartedBtnCancel"
          onPress={onCancel}
          title={<Trans i18nKey="common.cancel" />}
          type="secondary"
          outline={false}
          containerStyle={styles.buttonContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    paddingVertical: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 33,
    paddingVertical: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginVertical: 16,
    paddingHorizontal: 32,
  },
  bulletList: {
    paddingHorizontal: 16,
  },
  bulletItemContainer: {
    height: 48,
  },
  bulletItem: {
    fontSize: 14,
  },
  help: {
    marginTop: 32,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: "row",
  },
  warning: {
    width: "100%",
    marginTop: 16,
  },
  footer: {
    padding: 16,
  },
  buttonContainer: {
    marginTop: 4,
  },
});
