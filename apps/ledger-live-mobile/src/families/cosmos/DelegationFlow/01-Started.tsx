import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { useSelector } from "react-redux";
import invariant from "invariant";
import { Trans, useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { Alert, Button, Flex, Text } from "@ledgerhq/native-ui";
import cryptoFactory from "@ledgerhq/live-common/families/cosmos/chain/chain";

import { getMainAccount } from "@ledgerhq/live-common/account/helpers";
import { ScreenName } from "../../../const";
import LText from "../../../components/LText";

import ExternalLink from "../../../components/ExternalLink";
import BulletList, { BulletGreenCheck } from "../../../components/BulletList";
import NavigationScrollView from "../../../components/NavigationScrollView";
import { TrackScreen } from "../../../analytics";
import Illustration from "../../../images/illustration/Illustration";
import EarnLight from "../../../images/illustration/Light/_003.png";
import EarnDark from "../../../images/illustration/Dark/_003.png";
import { StackNavigatorProps } from "../../../components/RootNavigator/types/helpers";
import { CosmosDelegationFlowParamList } from "./types";
import { accountScreenSelector } from "../../../reducers/accounts";

type Props = StackNavigatorProps<
  CosmosDelegationFlowParamList,
  ScreenName.CosmosDelegationStarted
>;

export default function DelegationStarted({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const onNext = useCallback(() => {
    navigation.navigate(ScreenName.CosmosDelegationValidator, {
      ...route.params,
    });
  }, [navigation, route.params]);

  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  invariant(account, "account must be defined");

  const mainAccount = getMainAccount(account, parentAccount);
  const crypto = cryptoFactory(mainAccount.currency.id);
  const howDelegationWorks = useCallback(() => {
    Linking.openURL(cryptoFactory(mainAccount.currency.id).stakingDocUrl);
  }, [mainAccount.currency.id]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <NavigationScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}
      >
        <TrackScreen category="DelegationFlow" name="Started" />
        <Flex alignItems="center" mb={6}>
          <Illustration
            lightSource={EarnLight}
            darkSource={EarnDark}
            size={150}
          />
        </Flex>
        <Text fontWeight="semiBold" style={styles.description}>
          <Trans
            i18nKey="cosmos.delegation.flow.steps.starter.description"
            values={{ ticker: mainAccount.currency.ticker }}
          />
        </Text>
        <BulletList
          Bullet={BulletGreenCheck}
          list={[
            <Trans i18nKey="cosmos.delegation.flow.steps.starter.steps.0" />,
            <Trans
              i18nKey="cosmos.delegation.flow.steps.starter.steps.1"
              values={{ numberOfDays: crypto.unbondingPeriod }}
            />,
            <Trans i18nKey="cosmos.delegation.flow.steps.starter.steps.2" />,
          ].map(wording => (
            <LText semiBold>{wording}</LText>
          ))}
        />
        <View style={[styles.howDelegationWorks]}>
          <ExternalLink
            event="DelegationStartedHowDelegationWorks"
            onPress={howDelegationWorks}
            text={<Trans i18nKey="delegation.howDelegationWorks" />}
          />
        </View>
      </NavigationScrollView>
      <View style={[styles.footer]}>
        <View>
          <Alert
            type="info"
            title={t(
              "cosmos.delegation.flow.steps.starter.warning.description",
            )}
          />
        </View>
        <Button onPress={onNext} type="main" mt={6}>
          <Trans i18nKey="cosmos.delegation.flow.steps.starter.cta" />
        </Button>
      </View>
    </View>
  );
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
  learnMoreBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
});
