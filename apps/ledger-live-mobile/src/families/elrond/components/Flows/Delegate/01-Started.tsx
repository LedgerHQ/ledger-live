import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import { ScreenName } from "../../../../../const";
import Button from "../../../../../components/Button";
import LText from "../../../../../components/LText";
import ExternalLink from "../../../../../components/ExternalLink";
import BulletList, {
  BulletGreenCheck,
} from "../../../../../components/BulletList";
import NavigationScrollView from "../../../../../components/NavigationScrollView";
import IlluRewards from "../../../../../icons/images/Rewards";
import { urls } from "../../../../../config/urls";
import { TrackScreen } from "../../../../../analytics";
import Alert from "../../../../../components/Alert";

const forceInset = { bottom: "always" };

interface RouteParams {
  accountId: string;
}

interface Props {
  navigation: any;
  route: { params: RouteParams };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rewards: {
    height: 150,
    width: 150,
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
    marginBottom: 16,
  },
  bulletItem: {
    fontSize: 14,
  },
  howDelegationWorks: {
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

const Started = (props: Props) => {
  const { navigation, route } = props;
  const { colors } = useTheme();
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.ElrondDelegationValidator, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const howDelegationWorks = useCallback(() => {
    Linking.openURL(urls.elrondStaking);
  }, []);

  const onCancel = useCallback(() => {
    navigation.getParent().pop();
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: colors.background }]}
      forceInset={forceInset}
    >
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="DelegationFlow" name="Started" />
        <IlluRewards style={styles.rewards} />
        <LText semiBold style={styles.description}>
          <Trans i18nKey="elrond.delegation.flow.steps.starter.description" />
        </LText>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="elrond.delegation.flow.steps.starter.steps.0" />,
            <Trans i18nKey="elrond.delegation.flow.steps.starter.steps.1" />,
            <Trans i18nKey="elrond.delegation.flow.steps.starter.steps.2" />,
          ].map(wording => (
            <LText
              semiBold={true}
              style={[styles.bulletItem, { color: colors.black }]}
            >
              {wording}
            </LText>
          ))}
        />

        <View style={[styles.howDelegationWorks, { borderColor: colors.live }]}>
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
          <Alert type="help">
            <Trans i18nKey="elrond.delegation.flow.steps.starter.warning.description" />
          </Alert>
        </View>
      </NavigationScrollView>

      <View style={[styles.footer, { borderTopColor: colors.lightFog }]}>
        <Button
          event="DelegationStartedBtn"
          onPress={onNext}
          title={<Trans i18nKey="elrond.delegation.flow.steps.starter.cta" />}
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
};

export default Started;
