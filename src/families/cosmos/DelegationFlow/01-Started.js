// @flow
import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans, useTranslation } from "react-i18next";
import colors from "../../../colors";
import { ScreenName } from "../../../const";
import Button from "../../../components/Button";
import LText from "../../../components/LText";

import ExternalLink from "../../../components/ExternalLink";
import BulletList, { BulletGreenCheck } from "../../../components/BulletList";
import NavigationScrollView from "../../../components/NavigationScrollView";
import IlluRewards from "../IlluRewards";
import { urls } from "../../../config/urls";
import { TrackScreen } from "../../../analytics";
import VerifyAddressDisclaimer from "../../../components/VerifyAddressDisclaimer";

const forceInset = { bottom: "always" };

type RouteParams = {
  accountId: string,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function DelegationStarted({ navigation, route }: Props) {
  const { t } = useTranslation();
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.CosmosDelegationValidator, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const howDelegationWorks = useCallback(() => {
    Linking.openURL(urls.cosmosStaking);
  }, []);

  const onLearnMore = useCallback(() => {
    Linking.openURL(urls.cosmosStakingRewards);
  }, []);

  const onCancel = useCallback(() => {
    navigation.dangerouslyGetParent().pop();
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} forceInset={forceInset}>
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="DelegationFlow" name="Started" />
        <IlluRewards />
        <LText semiBold style={styles.title}>
          <Trans
            secondary
            i18nKey="cosmos.delegation.flow.steps.starter.title"
          />
        </LText>
        <LText semiBold style={styles.description}>
          <Trans i18nKey="cosmos.delegation.flow.steps.starter.description" />
        </LText>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="cosmos.delegation.flow.steps.starter.steps.0" />,
            <Trans i18nKey="cosmos.delegation.flow.steps.starter.steps.1" />,
            <Trans i18nKey="cosmos.delegation.flow.steps.starter.steps.2" />,
          ].map(wording => (
            <LText semiBold style={styles.bulletItem}>
              {wording}
            </LText>
          ))}
        />
        <View style={styles.howDelegationWorks}>
          <ExternalLink
            event="DelegationStartedHowDelegationWorks"
            onPress={howDelegationWorks}
            text={<Trans i18nKey="delegation.howDelegationWorks" />}
            ltextProps={{
              secondary: true,
            }}
          />
        </View>
        <View style={styles.warning}>
          <VerifyAddressDisclaimer
            text={
              <Trans i18nKey="cosmos.delegation.flow.steps.starter.warning.description" />
            }
            verified
            action={
              <Button
                event="DelegationStartedLearnMore"
                type="lightSecondary"
                onPress={onLearnMore}
                containerStyle={styles.learnMoreBtn}
                title={t("common.learnMore")}
              />
            }
          />
        </View>
      </NavigationScrollView>
      <View style={styles.footer}>
        <Button
          event="DelegationStartedBtn"
          onPress={onNext}
          title={<Trans i18nKey="cosmos.delegation.flow.steps.starter.cta" />}
          type="primary"
        />
        <Button
          event="DelegationStartedCancel"
          onPress={onCancel}
          title={<Trans i18nKey="common.cancel" />}
          type="darkSecondary"
          outline={false}
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
    paddingHorizontal: 32,
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
    fontSize: 16,
    lineHeight: 21,
    color: colors.darkBlue,
    textAlign: "center",
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 14,
    color: colors.black,
  },
  howDelegationWorks: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderColor: colors.live,
    flexDirection: "row",
  },
  howDelegationWorksText: {
    color: colors.live,
    fontSize: 14,
  },
  warning: {
    width: "100%",
    marginTop: 16,
  },
  learnMoreBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.lightFog,
  },
});
