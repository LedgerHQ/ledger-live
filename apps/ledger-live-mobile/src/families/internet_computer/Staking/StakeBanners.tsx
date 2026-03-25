import type { ICPAccount } from "@ledgerhq/live-common/families/internet_computer/types";
import { getBannerState } from "@ledgerhq/live-common/families/internet_computer/utils";
import { Alert, Flex } from "@ledgerhq/native-ui";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Linking, StyleSheet, Text, View } from "react-native";
import Button from "~/components/wrappedUi/Button";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";

type BannerState = "confirmFollowing" | "syncNeurons" | "lockNeurons" | "addFollowees" | "stakeICP";

type Props = {
  account: ICPAccount;
};

type BannerConfig = {
  descriptionKey: string;
  ctaKey: string;
  onPress: () => void;
};

export default function StakeBanners({ account }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const bannerState = useMemo(() => {
    if (!account.neurons) return null;
    return getBannerState(account);
  }, [account]);

  const onNavigateToStaking = useCallback(() => {
    const hasNeurons = account.neurons?.fullNeurons?.length > 0;
    (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
      NavigatorName.InternetComputerStakingFlow,
      {
        screen: hasNeurons
          ? ScreenName.InternetComputerStakingAmount
          : ScreenName.InternetComputerStakingStarted,
        params: { accountId: account.id },
      },
    );
  }, [navigation, account]);

  const onNavigateToManageNeurons = useCallback(() => {
    (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
      NavigatorName.InternetComputerNeuronManageFlow,
      {
        screen: ScreenName.InternetComputerNeuronList,
        params: { accountId: account.id },
      },
    );
  }, [navigation, account.id]);

  const onNavigateToConfirmFollowing = useCallback(() => {
    (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
      NavigatorName.InternetComputerNeuronManageFlow,
      {
        screen: ScreenName.InternetComputerNeuronConfirmFollowingList,
        params: { accountId: account.id },
      },
    );
  }, [navigation, account.id]);

  const onNavigateToSyncNeurons = useCallback(() => {
    (navigation as NativeStackNavigationProp<{ [key: string]: object }>).navigate(
      NavigatorName.InternetComputerNeuronManageFlow,
      {
        screen: ScreenName.InternetComputerNeuronList,
        params: { accountId: account.id },
      },
    );
  }, [navigation, account.id]);

  const getConfirmFollowingDescriptionKey = useCallback(() => {
    if (!bannerState?.data) {
      return "icp.stakeBanner.confirmFollowing.altDescription";
    }
    const { days, hours } = bannerState.data;
    if (days === 0 && hours === 0) {
      return "icp.stakeBanner.confirmFollowing.urgentDescription";
    }
    return "icp.stakeBanner.confirmFollowing.description";
  }, [bannerState?.data]);

  const onLearnMore = useCallback(() => {
    Linking.openURL(urls.internetComputer.stakingRewards);
  }, []);

  const bannerConfigs = useMemo<Record<BannerState, BannerConfig>>(
    () => ({
      confirmFollowing: {
        descriptionKey: getConfirmFollowingDescriptionKey(),
        ctaKey: "icp.stakeBanner.confirmFollowing.cta",
        onPress: onNavigateToConfirmFollowing,
      },
      syncNeurons: {
        descriptionKey: "icp.stakeBanner.syncNeurons.altDescription",
        ctaKey: "icp.stakeBanner.syncNeurons.cta",
        onPress: onNavigateToSyncNeurons,
      },
      lockNeurons: {
        descriptionKey: "icp.stakeBanner.lockNeurons.description",
        ctaKey: "icp.stakeBanner.lockNeurons.cta",
        onPress: onNavigateToManageNeurons,
      },
      addFollowees: {
        descriptionKey: "icp.stakeBanner.addFollowees.description",
        ctaKey: "icp.stakeBanner.addFollowees.cta",
        onPress: onNavigateToManageNeurons,
      },
      stakeICP: {
        descriptionKey: "icp.stakeBanner.stakeICP.description",
        ctaKey: "icp.stakeBanner.stakeICP.cta",
        onPress: onNavigateToStaking,
      },
    }),
    [
      bannerState?.data,
      onNavigateToConfirmFollowing,
      onNavigateToManageNeurons,
      onNavigateToSyncNeurons,
      onNavigateToStaking,
    ],
  );

  if (!bannerState) return null;

  const { state, data } = bannerState;
  const config = bannerConfigs[state];

  if (!config) return null;

  const description = t(config.descriptionKey, {
    days: data?.days,
    hours: data?.hours,
  });

  return (
    <View style={styles.container}>
      <Alert type="info" showIcon={false}>
        <Flex flexDirection="column" alignItems="center" style={styles.banner}>
          <Flex flex={1} mr={3}>
            <Alert.BodyText>
              {description}{" "}
              <Text style={styles.learnMore} onPress={onLearnMore}>
                {t("icp.stakeBanner.learnMore")}
              </Text>
            </Alert.BodyText>
          </Flex>
          <Button type="color" size="small" onPress={config.onPress}>
            {t(config.ctaKey)}
          </Button>
        </Flex>
      </Alert>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  banner: {
    gap: 16,
    alignItems: "flex-end",
  },
  learnMore: {
    color: "#6E56CF",
    textDecorationLine: "underline",
  },
});
