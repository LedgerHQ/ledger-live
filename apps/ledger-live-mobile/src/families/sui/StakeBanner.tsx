import React, { useCallback } from "react";
import { View, StyleSheet, Linking } from "react-native";
import { Flex, Alert } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Trans, useTranslation } from "react-i18next";
import type { Account } from "@ledgerhq/types-live";
import { useSuiStakingBanners } from "@ledgerhq/live-common/families/sui/react";
import { NavigatorName, ScreenName } from "~/const";
import AccountBanner from "~/components/AccountBanner";
import Button from "~/components/wrappedUi/Button";

type Props = {
  account: Account;
};

const SuiStakeBanner: React.FC<Props> = ({ account }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { showBoostBanner, showIncentiveBanner } = useSuiStakingBanners(account.freshAddress);

  const handleStakeClick = useCallback(() => {
    (navigation as StackNavigationProp<{ [key: string]: object }>).navigate(
      NavigatorName.SuiDelegateFlow,
      {
        screen: ScreenName.SuiStakingValidator,
        params: {
          accountId: account.id,
        },
      },
    );
  }, [navigation, account]);

  const handleHowItWorksClick = useCallback(() => {
    Linking.openURL("https://www.ledger.com/sui-staking-boost");
  }, []);

  const handleLearnMoreClick = useCallback(() => {
    Linking.openURL("https://www.ledger.com/sui-incentives");
  }, []);

  if (!showBoostBanner && !showIncentiveBanner) {
    return null;
  }

  return (
    <View style={styles.root}>
      {showBoostBanner && (
        <Alert type="info" showIcon={false}>
          <Flex flexDirection="column" width="100%">
            <Alert.BodyText fontWeight="semiBold" mb={2}>
              <Trans i18nKey="sui.staking.banner.boost.title" />
            </Alert.BodyText>
            <Alert.BodyText mb={3} color="neutral.c70">
              <Trans i18nKey="sui.staking.banner.boost.description" />
            </Alert.BodyText>
            <Flex flexDirection="row" alignItems="center" justifyContent="space-between">
              <Button onPress={handleHowItWorksClick} size="small" type="shade" outline>
                {t("sui.staking.banner.boost.howItWorks")}
              </Button>
              <Button onPress={handleStakeClick} size="small" type="main">
                {t("sui.staking.banner.boost.stakeWithLedger")}
              </Button>
            </Flex>
          </Flex>
        </Alert>
      )}

      {showIncentiveBanner && (
        <View style={styles.secondBanner}>
          <AccountBanner
            description={t("sui.staking.banner.incentive.description")}
            cta={t("sui.staking.banner.incentive.cta")}
            onPress={handleLearnMoreClick}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    marginBottom: 16,
  },
  secondBanner: {
    marginTop: 16,
  },
});

export default SuiStakeBanner;
