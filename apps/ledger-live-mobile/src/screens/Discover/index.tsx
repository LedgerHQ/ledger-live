import React, { memo, useCallback, useMemo, useContext } from "react";
import { Linking, Platform, ScrollView } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import TabBarSafeAreaView from "~/components/TabBar/TabBarSafeAreaView";
import Illustration from "~/images/illustration/Illustration";
import { NavigatorName, ScreenName } from "~/const";
import DiscoverCard from "./DiscoverCard";
import { urls } from "~/utils/urls";
import { TrackScreen, track } from "~/analytics";
import { AnalyticsContext } from "~/analytics/AnalyticsContext";
import { BaseNavigatorStackParamList } from "~/components/RootNavigator/types/BaseNavigator";
import { MainNavigatorParamList } from "~/components/RootNavigator/types/MainNavigator";

const images = {
  light: {
    learnImg: require("~/images/illustration/Light/_063.webp"),
    appsImg: require("~/images/illustration/Light/_086.webp"),
    earnImg: require("~/images/illustration/Light/_088.webp"),
    mintImg: require("~/images/illustration/Light/_087.webp"),
    referralImg: require("~/images/illustration/Light/_ReferralProgram.webp"),
  },
  dark: {
    learnImg: require("~/images/illustration/Dark/_063.webp"),
    appsImg: require("~/images/illustration/Dark/_086.webp"),
    earnImg: require("~/images/illustration/Dark/_088.webp"),
    mintImg: require("~/images/illustration/Dark/_087.webp"),
    referralImg: require("~/images/illustration/Dark/_ReferralProgram.webp"),
  },
};

function Discover() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      NativeStackNavigationProp<BaseNavigatorStackParamList & MainNavigatorParamList>
    >();

  const isNFTDisabled = useFeature("disableNftLedgerMarket")?.enabled && Platform.OS === "ios";

  const readOnlyTrack = useCallback((bannerName: string) => {
    track("banner_clicked", {
      banner: `Dapp_${bannerName}`,
      screen: "Discover",
    });
    track("Discover Banner Clicked", {
      banner: `Dapp_${bannerName}`,
      screen: "Discover",
    });
  }, []);

  const config = useFeature("discover");

  const featuresList: {
    title: string;
    subTitle?: string;
    labelBadge?: string;
    Image: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
  }[] = useMemo(
    () =>
      [
        ...(config?.enabled && config?.params?.version === "2"
          ? [
              {
                title: t("discover.sections.browseWeb3.title"),
                subTitle: t("discover.sections.browseWeb3.desc"),
                onPress: () => {
                  navigation.navigate(NavigatorName.Discover, {
                    screen: ScreenName.PlatformCatalog,
                  });
                },
                disabled: false,
                Image: (
                  <Illustration
                    size={110}
                    darkSource={images.dark.appsImg}
                    lightSource={images.light.appsImg}
                  />
                ),
              },
            ]
          : Platform.OS !== "ios"
            ? [
                {
                  title: t("discover.sections.ledgerApps.title"),
                  subTitle: t("discover.sections.ledgerApps.desc"),
                  onPress: () => {
                    navigation.navigate(NavigatorName.Discover, {
                      screen: ScreenName.PlatformCatalog,
                    });
                  },
                  disabled: false,
                  Image: (
                    <Illustration
                      size={110}
                      darkSource={images.dark.appsImg}
                      lightSource={images.light.appsImg}
                    />
                  ),
                },
              ]
            : []),
        {
          title: t("discover.sections.earn.title"),
          subTitle: t("discover.sections.earn.desc"),
          onPress: () => {
            readOnlyTrack("Earn");
            track("Discover - Earn - OpenUrl", { url: urls.discover.earn });
            Linking.openURL(urls.discover.earn);
          },
          disabled: false,
          Image: (
            <Illustration
              size={110}
              darkSource={images.dark.earnImg}
              lightSource={images.light.earnImg}
            />
          ),
        },
        ...(isNFTDisabled
          ? []
          : [
              {
                title: t("discover.sections.mint.title"),
                subTitle: t("discover.sections.mint.desc"),
                onPress: () => {
                  readOnlyTrack("Mint");
                  track("Discover - Mint - OpenUrl", {
                    url: urls.discover.mint,
                  });
                  Linking.openURL(urls.discover.mint);
                },
                disabled: false,
                Image: (
                  <Illustration
                    size={110}
                    darkSource={images.dark.mintImg}
                    lightSource={images.light.mintImg}
                  />
                ),
              },
            ]),
        {
          title: t("discover.sections.referralProgram.title"),
          subTitle: t("discover.sections.referralProgram.desc"),
          onPress: () => {
            readOnlyTrack("referralProgram");
            track("Discover - Refer Program - OpenUrl", {
              url: urls.referralProgram,
            });
            Linking.openURL(urls.referralProgram);
          },
          disabled: false,
          Image: (
            <Illustration
              size={110}
              darkSource={images.dark.referralImg}
              lightSource={images.light.referralImg}
            />
          ),
        },
      ].sort((a, b) => (b.disabled ? -1 : 0)),
    [t, isNFTDisabled, navigation, readOnlyTrack, config],
  );

  const { setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen && setScreen("Discover");

      return () => {
        setSource("Discover");
      };
    }, [setSource, setScreen]),
  );

  return (
    <TabBarSafeAreaView>
      <TrackScreen category="Discover" />
      <Flex px={6} pb={6} flexDirection="row">
        <Flex flex={1} justifyContent="flex-start" alignItems="flex-start">
          <Text my={3} variant="h4" fontWeight="semiBold">
            {t("discover.title")}
          </Text>
        </Flex>
      </Flex>
      <ScrollView>
        {featuresList.map(({ title, subTitle, onPress, disabled, labelBadge, Image }, i) => (
          <DiscoverCard
            key={i}
            title={title}
            subTitle={subTitle}
            onPress={onPress}
            disabled={disabled}
            labelBadge={labelBadge}
            imageContainerProps={{
              position: "relative",
              height: "auto",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              paddingRight: 4,
            }}
            Image={Image}
          />
        ))}
      </ScrollView>
    </TabBarSafeAreaView>
  );
}

export default memo(Discover);
