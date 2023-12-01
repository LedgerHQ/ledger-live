import React, { useCallback } from "react";
import { View, Linking } from "react-native";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";

import { ScreenName } from "~/const";
import Button from "~/components/Button";
import LText from "~/components/LText";
import ExternalLink from "~/components/ExternalLink";
import NavigationScrollView from "~/components/NavigationScrollView";
import IlluRewards from "~/icons/images/Rewards";
import Alert from "~/components/Alert";
import BulletList, { BulletGreenCheck } from "~/components/BulletList";

import { urls } from "~/utils/urls";
import { TrackScreen } from "~/analytics";

import type { EarnRewardsPropsType } from "./types";

import styles from "./styles";

/*
 * Handle the component declaration.
 */

const EarnRewards = (props: EarnRewardsPropsType) => {
  const { navigation, route } = props;
  const { colors } = useTheme();
  const { t } = useTranslation();

  /*
   * Callback called when navigating to the next screen of the current flow.
   */

  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.ElrondDelegationValidator, route.params);
  }, [navigation, route.params]);

  /*
   * External link opened through React Native's library.
   */

  const howDelegationWorks = useCallback(() => {
    Linking.openURL(urls.elrondStaking);
  }, []);

  /*
   * The bulleted list items' translation keys.
   */

  const bulletList = [
    "elrond.delegation.flow.steps.starter.steps.0",
    "elrond.delegation.flow.steps.starter.steps.1",
    "elrond.delegation.flow.steps.starter.steps.2",
  ];

  /*
   * Return the rendered component.
   */

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationScrollView style={styles.scroll} contentContainerStyle={styles.scrollContainer}>
        <TrackScreen
          category="DelegationFlow"
          name="Started"
          flow="stake"
          action="delegate"
          currency="egld"
        />
        <IlluRewards style={styles.rewards} />

        <LText semiBold style={styles.description}>
          <Trans i18nKey="elrond.delegation.flow.steps.starter.description" />
        </LText>

        <BulletList
          Bullet={BulletGreenCheck}
          list={bulletList.map(item => (
            <LText semiBold={true} key={item}>
              <Trans i18nKey={item} />
            </LText>
          ))}
        />

        <View style={styles.howDelegationWorks}>
          <ExternalLink
            event="DelegationStartedHowDelegationWorks"
            onPress={howDelegationWorks}
            text={<Trans i18nKey="delegation.howDelegationWorks" />}
          />
        </View>
      </NavigationScrollView>

      <View style={styles.footer}>
        <Alert type="help" title={t("elrond.delegation.flow.steps.starter.warning.description")} />

        <Button onPress={onNext} type="main" mt={6}>
          <Trans i18nKey="elrond.delegation.flow.steps.starter.cta" />
        </Button>
      </View>
    </View>
  );
};

export default EarnRewards;
