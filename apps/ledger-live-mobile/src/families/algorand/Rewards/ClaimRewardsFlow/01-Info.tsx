import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { ScreenName, NavigatorName } from "~/const";
import Button from "~/components/Button";
import LText from "~/components/LText";
import ExternalLink from "~/components/ExternalLink";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";
import NavigationScrollView from "~/components/NavigationScrollView";
import { urls } from "~/utils/urls";
import { TrackScreen } from "~/analytics";
import Illustration from "~/images/illustration/Illustration";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { AlgorandClaimRewardsFlowParamList } from "./type";

type Props = BaseComposite<
  StackNavigatorProps<AlgorandClaimRewardsFlowParamList, ScreenName.AlgorandClaimRewardsInfo>
>;

export default function ClaimRewardsStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onNext = useCallback(() => {
    navigation.pop();
    navigation.navigate(NavigatorName.ReceiveFunds, {
      screen: ScreenName.ReceiveConfirmation,
      params: route.params,
    });
  }, [navigation, route.params]);
  const howClaimRewardsWorks = useCallback(() => {
    Linking.openURL(urls.algorandStaking);
  }, []);
  return (
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen
          category="ClaimRewardsFlow"
          name="Started"
          flow="stake"
          action="claim_rewards"
          currency="algo"
        />
        <Flex alignItems="center" justifyContent="center" mb={6}>
          <Illustration
            size={200}
            lightSource={require("~/images/illustration/Light/_003.png")}
            darkSource={require("~/images/illustration/Dark/_003.png")}
          />
        </Flex>
        <LText semiBold style={styles.description}>
          <Trans i18nKey="algorand.claimRewards.flow.steps.info.description" />
        </LText>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[
            <Trans
              i18nKey="algorand.claimRewards.flow.steps.info.steps.0"
              key="claimRewardsText1"
            />,
            <Trans
              i18nKey="algorand.claimRewards.flow.steps.info.steps.1"
              key="claimRewardsText2"
            />,
            <Trans
              i18nKey="algorand.claimRewards.flow.steps.info.steps.2"
              key="claimRewardsText3"
            />,
          ].map(wording => (
            <LText semiBold style={styles.bulletItem} color="black" key={wording.key}>
              {wording}
            </LText>
          ))}
        />
        <View
          style={[
            styles.howClaimRewardsWorks,
            {
              borderColor: colors.live,
            },
          ]}
        >
          <ExternalLink
            event="AlgorandHowRewardsWork"
            onPress={howClaimRewardsWorks}
            text={<Trans i18nKey="algorand.claimRewards.flow.steps.info.howItWorks" />}
          />
        </View>
      </NavigationScrollView>
      <View style={[styles.footer]}>
        <Button
          event="ClaimRewardsStartedBtn"
          onPress={onNext}
          title={<Trans i18nKey="algorand.claimRewards.flow.steps.starter.cta" />}
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
  },
});
