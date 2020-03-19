// @flow
import React, { useCallback } from "react";
import { StyleSheet, ScrollView, View, Linking } from "react-native";
import { SafeAreaView } from "react-navigation";
import { Trans } from "react-i18next";
import i18next from "i18next";
import type { NavigationScreenProp } from "react-navigation";
import colors from "../../colors";
import { TrackScreen } from "../../analytics";
import StepHeader from "../../components/StepHeader";
import Button from "../../components/Button";
import LText from "../../components/LText";
import ExternalLink from "../../components/ExternalLink";
import BulletList, { BulletGreenCheck } from "../../components/BulletList";
import { urls } from "../../config/urls";
import IlluRewards from "./IlluRewards";

const forceInset = { bottom: "always" };

type Props = {
  navigation: NavigationScreenProp<{
    params: {},
  }>,
};

const FreezeInfo = ({ navigation }: Props) => {
  const onNext = useCallback(() => {
    navigation.navigate("FreezeAmount", {
      ...navigation.state.params,
    });
  }, [navigation]);

  const onCancel = useCallback(() => {
    // $FlowFixMe
    navigation.pop();
  }, [navigation]);

  const howVotingWorks = useCallback(() => {
    /** @TODO get the correct support page link for the voting part */
    Linking.openURL(urls.delegation);
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
        />
      </View>
    </SafeAreaView>
  );
};

FreezeInfo.navigationOptions = {
  headerTitle: <StepHeader title={i18next.t("freeze.stepperHeader.info")} />,
};

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
});

export default FreezeInfo;
