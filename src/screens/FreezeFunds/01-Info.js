// @flow
import React, { useCallback } from "react";
import { StyleSheet, ScrollView, View, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import colors from "../../colors";
import { ScreenName } from "../../const";
import { TrackScreen } from "../../analytics";
import Button from "../../components/Button";
import LText from "../../components/LText";
import ExternalLink from "../../components/ExternalLink";
import BulletList, { BulletGreenCheck } from "../../components/BulletList";
import IlluRewards from "../../components/IlluRewards";
import { urls } from "../../config/urls";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

type RouteParams = {};

export default function FreezeInfo({ navigation, route }: Props) {
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.FreezeAmount, route.params);
  }, [navigation, route.params]);

  const onCancel = useCallback(() => {
    navigation.popToTop();
  }, [navigation]);

  const howVotingWorks = useCallback(() => {
    Linking.openURL(urls.tronStaking);
  }, []);

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="FreezeFlow" name="Info" />
        <IlluRewards />
        <LText secondary style={styles.description}>
          <Trans i18nKey="freeze.info.description" />
        </LText>
        <BulletList
          style={{ paddingHorizontal: 16 }}
          itemContainerStyle={{ height: 48 }}
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="freeze.info.steps.0" />,
            <Trans i18nKey="freeze.info.steps.1" />,
            <Trans i18nKey="freeze.info.steps.2" />,
          ].map(wording => (
            <LText secondary semiBold style={styles.bulletItem}>
              {wording}
            </LText>
          ))}
        />
        <View style={styles.howVotingWorks}>
          <ExternalLink
            event="FreezeInfoHowVotingWorks"
            onPress={howVotingWorks}
            text={<Trans i18nKey="freeze.info.howVotingWorks" />}
            ltextProps={{
              secondary: true,
            }}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          event="FreezeInfoBtn"
          onPress={onNext}
          title={<Trans i18nKey="freeze.info.cta" />}
          type="primary"
        />
        <Button
          event="FreezeInfoBtnCancel"
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
    backgroundColor: colors.white,
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
    color: colors.darkBlue,
    paddingVertical: 16,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.darkBlue,
    textAlign: "center",
    marginVertical: 16,
    paddingHorizontal: 32,
  },
  bulletItem: {
    fontSize: 14,
    color: colors.black,
  },
  howVotingWorks: {
    marginTop: 32,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.live,
    flexDirection: "row",
  },
  howVotingWorksText: {
    color: colors.live,
    fontSize: 14,
  },
  footer: {
    padding: 16,
  },
  buttonContainer: {
    marginTop: 4,
  },
});
