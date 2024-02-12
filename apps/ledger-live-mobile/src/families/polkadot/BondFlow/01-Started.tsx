import React, { useCallback } from "react";
import { StyleSheet, ScrollView, View, Linking, SafeAreaView } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { Flex } from "@ledgerhq/native-ui";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import LText from "~/components/LText";
import ExternalLink from "~/components/ExternalLink";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";
import Alert from "~/components/Alert";
import { urls } from "~/utils/urls";
import Illustration from "~/images/illustration/Illustration";
import EarnLight from "~/images/illustration/Light/_003.png";
import EarnDark from "~/images/illustration/Dark/_003.png";
import Button from "~/components/wrappedUi/Button";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PolkadotBondFlowParamList } from "./types";

type Props = StackNavigatorProps<PolkadotBondFlowParamList, ScreenName.PolkadotBondStarted>;

export default function PolkadotBondStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.PolkadotBondAmount, route.params);
  }, [navigation, route.params]);
  const onHelp = useCallback(() => {
    Linking.openURL(urls.polkadotStaking);
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
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen category="BondFlow" name="Started" flow="stake" action="bond" currency="dot" />
        <Flex alignItems="center" mb={6}>
          <Illustration lightSource={EarnLight} darkSource={EarnDark} size={150} />
        </Flex>
        <LText secondary style={styles.description}>
          <Trans i18nKey="polkadot.bond.steps.starter.description" />
        </LText>
        <BulletList
          style={styles.bulletList}
          itemContainerStyle={styles.bulletItemContainer}
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="polkadot.bond.steps.starter.bullet.0" key="BondingText1" />,
            <Trans i18nKey="polkadot.bond.steps.starter.bullet.1" key="BondingText2" />,
            <Trans i18nKey="polkadot.bond.steps.starter.bullet.2" key="BondingText2" />,
          ].map(wording => (
            <LText secondary semiBold style={styles.bulletItem} key={wording.key}>
              {wording}
            </LText>
          ))}
        />
        <View style={styles.help}>
          <ExternalLink
            event="PolkadotBondStartedHelp"
            onPress={onHelp}
            text={<Trans i18nKey="polkadot.bond.steps.starter.help" />}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Alert type="help">
          <Trans i18nKey="polkadot.bond.steps.starter.warning" />
        </Alert>
        <Button event="PolkadotBondStartedBtn" onPress={onNext} type="main" mt={6}>
          <Trans i18nKey="common.continue" />
        </Button>
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
    minHeight: 48,
  },
  bulletItem: {
    fontSize: 14,
  },
  help: {
    marginTop: 32,
  },
  footer: {
    padding: 16,
  },
});
