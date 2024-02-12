import React, { useCallback } from "react";
import { StyleSheet, ScrollView, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "react-i18next";
import { CompositeScreenProps, useTheme } from "@react-navigation/native";
import { ScreenName } from "~/const";
import { TrackScreen } from "~/analytics";
import Button from "~/components/Button";
import LText from "~/components/LText";
import ExternalLink from "~/components/ExternalLink";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";
import IlluRewards from "~/icons/images/Rewards";
import { urls } from "~/utils/urls";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { FreezeNavigatorParamList } from "~/components/RootNavigator/types/FreezeNavigator";

type NavigatorProps = CompositeScreenProps<
  StackNavigatorProps<FreezeNavigatorParamList, ScreenName.FreezeInfo>,
  StackNavigatorProps<BaseNavigatorStackParamList>
>;

export default function FreezeInfo({ navigation, route }: NavigatorProps) {
  const { colors } = useTheme();
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
    <SafeAreaView
      style={[
        styles.root,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen category="FreezeFlow" name="Info" />
        <IlluRewards />
        <LText secondary style={styles.description}>
          <Trans i18nKey="freeze.info.description" />
        </LText>
        <BulletList
          style={styles.bulletList}
          itemContainerStyle={styles.bulletItemContainer}
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="freeze.info.steps.0" key="FreezeText1" />,
            <Trans i18nKey="freeze.info.steps.1" key="FreezeText2" />,
            <Trans i18nKey="freeze.info.steps.2" key="FreezeText3" />,
          ].map(wording => (
            <LText secondary semiBold style={[styles.bulletItem]} key={wording.key}>
              {wording}
            </LText>
          ))}
        />
        <View
          style={[
            styles.howVotingWorks,
            {
              borderColor: colors.live,
            },
          ]}
        >
          <ExternalLink
            event="FreezeInfoHowVotingWorks"
            onPress={howVotingWorks}
            text={<Trans i18nKey="freeze.info.howVotingWorks" />}
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
  howVotingWorks: {
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
  buttonContainer: {
    marginTop: 4,
  },
});
