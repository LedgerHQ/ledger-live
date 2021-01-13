// @flow
import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { ScreenName, NavigatorName } from "../../../../const";
import Button from "../../../../components/Button";
import LText from "../../../../components/LText";

import ExternalLink from "../../../../components/ExternalLink";
import BulletList, {
  BulletGreenCheck,
} from "../../../../components/BulletList";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import IlluRewards from "../../../../icons/images/Rewards";
import { urls } from "../../../../config/urls";
import { TrackScreen } from "../../../../analytics";

const forceInset = { bottom: "always" };

type RouteParams = {
  accountId: string,
};

type Props = {
  navigation: any,
  route: { params: RouteParams },
};

export default function ClaimRewardsStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onNext = useCallback(() => {
    navigation.pop();
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConnectDevice,
      params: route.params,
    });
  }, [navigation, route.params]);

  const howClaimRewardsWorks = useCallback(() => {
    Linking.openURL(urls.algorandStaking);
  }, []);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="ClaimRewardsFlow" name="Started" />
        <IlluRewards />
        <LText semiBold style={styles.description}>
          <Trans i18nKey="algorand.claimRewards.flow.steps.info.description" />
        </LText>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="algorand.claimRewards.flow.steps.info.steps.0" />,
            <Trans i18nKey="algorand.claimRewards.flow.steps.info.steps.1" />,
            <Trans i18nKey="algorand.claimRewards.flow.steps.info.steps.2" />,
          ].map(wording => (
            <LText semiBold style={styles.bulletItem} color="black">
              {wording}
            </LText>
          ))}
        />
        <View
          style={[styles.howClaimRewardsWorks, { borderColor: colors.live }]}
        >
          <ExternalLink
            event="AlgorandHowRewardsWork"
            onPress={howClaimRewardsWorks}
            text={
              <Trans i18nKey="algorand.claimRewards.flow.steps.info.howItWorks" />
            }
            ltextProps={{
              secondary: true,
            }}
          />
        </View>
      </NavigationScrollView>
      <View style={[styles.footer, { borderTopColor: colors.lightFog }]}>
        <Button
          event="ClaimRewardsStartedBtn"
          onPress={onNext}
          title={
            <Trans i18nKey="algorand.claimRewards.flow.steps.starter.cta" />
          }
          type="primary"
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
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    lineHeight: 33,
    paddingVertical: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    marginVertical: 16,
  },
  bulletItem: {
    fontSize: 14,
  },
  howClaimRewardsWorks: {
    paddingVertical: 8,
    paddingHorizontal: 16,

    flexDirection: "row",
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
  },
});
