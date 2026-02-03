import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import { TrackScreen } from "~/analytics";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";
import ExternalLink from "~/components/ExternalLink";
import LText from "~/components/LText";
import NavigationScrollView from "~/components/NavigationScrollView";
import type { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { ScreenName } from "~/const";
import EarnDark from "~/images/illustration/Dark/_003.webp";
import Illustration from "~/images/illustration/Illustration";
import EarnLight from "~/images/illustration/Light/_003.webp";
import { urls } from "~/utils/urls";
import type { InternetComputerStakingFlowParamList } from "./types";

type Props = BaseComposite<
  StackNavigatorProps<
    InternetComputerStakingFlowParamList,
    ScreenName.InternetComputerStakingStarted
  >
>;

export default function StakingStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.InternetComputerStakingAmount, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const howStakingWorks = useCallback(() => {
    Linking.openURL(urls.internetComputer.stakingRewards);
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen
          category="ICP Staking"
          name="Step Starter"
          screen="Started"
          flow="stake"
          action="staking"
          currency="internet_computer"
        />
        <Flex alignItems="center" mb={6}>
          <Illustration lightSource={EarnLight} darkSource={EarnDark} size={150} />
        </Flex>
        <Text fontWeight="semiBold" style={styles.description}>
          <Trans i18nKey="icp.staking.flow.steps.starter.description" />
        </Text>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[<Trans i18nKey="icp.staking.flow.steps.starter.steps.0" key="StakingText0" />].map(
            wording => (
              <LText semiBold key={wording.key}>
                {wording}
              </LText>
            ),
          )}
        />
        <View style={[styles.howStakingWorks]}>
          <ExternalLink
            event="ICPStakingStartedHowStakingWorks"
            onPress={howStakingWorks}
            text={<Trans i18nKey="icp.staking.flow.steps.starter.learnMore" />}
          />
        </View>
      </NavigationScrollView>
      <View style={[styles.footer]}>
        <View>
          <Alert type="info" title={t("icp.staking.flow.steps.starter.warning")} />
        </View>
        <Button onPress={onNext} type="main" mt={6} testID="icp-staking-start-button">
          <Trans i18nKey="icp.staking.flow.steps.starter.cta" />
        </Button>
      </View>
    </View>
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
  description: {
    fontSize: 16,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: 16,
  },
  howStakingWorks: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
