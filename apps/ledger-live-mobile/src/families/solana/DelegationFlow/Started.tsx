import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import React, { useCallback } from "react";
import { Trans } from "react-i18next";
import { Linking, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TrackScreen } from "~/analytics";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";
import Button from "~/components/Button";
import ExternalLink from "~/components/ExternalLink";
import NavigationScrollView from "~/components/NavigationScrollView";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { urls } from "~/utils/urls";
import { ScreenName } from "~/const";
import IlluStaking from "../../tezos/IlluStaking";
import { SolanaDelegationFlowParamList } from "./types";

type Props = StackNavigatorProps<SolanaDelegationFlowParamList, ScreenName.SolanaDelegationStarted>;

export default function DelegationStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.DelegationSummary, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const howDelegationWorks = useCallback(() => {
    Linking.openURL(urls.solana.stakingPage);
  }, []);

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen
          category="DelegationFlow"
          name="Started"
          flow="stake"
          action="delegation"
          currency="sol"
        />
        <IlluStaking />
        <Text fontWeight="semiBold" style={styles.title}>
          <Trans i18nKey="delegation.started.title" />
        </Text>
        <Text style={styles.description}>
          <Trans i18nKey="solana.delegation.started.description" />
        </Text>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="delegation.started.steps.0" key="DelegationText1" />,
            <Trans i18nKey="delegation.started.steps.1" key="DelegationText2" />,
            <Trans i18nKey="delegation.started.steps.2" key="DelegationText3" />,
          ].map(wording => (
            <Text fontWeight="semiBold" style={styles.bulletItem} color="black" key={wording.key}>
              {wording}
            </Text>
          ))}
        />
        <View style={[styles.howDelegationWorks, { borderColor: colors.live }]}>
          <ExternalLink
            event="DelegationStartedHowDelegationWorks"
            onPress={howDelegationWorks}
            text={<Trans i18nKey="delegation.howDelegationWorks" />}
          />
        </View>
      </NavigationScrollView>
      <View style={styles.footer}>
        <Button
          event="DelegationStartedBtn"
          onPress={onNext}
          title={<Trans i18nKey="delegation.started.cta" />}
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
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 14,
  },
  howDelegationWorks: {
    marginTop: 32,
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: "row",
  },
  footer: {
    padding: 16,
  },
});
