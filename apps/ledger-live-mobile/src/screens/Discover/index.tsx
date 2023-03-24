import React, { memo, useCallback, useMemo, useContext } from "react";
import { Linking, Platform, ScrollView } from "react-native";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { StackNavigationProp } from "@react-navigation/stack";
import Illustration from "../../images/illustration/Illustration";
import { NavigatorName, ScreenName } from "../../const";
import DiscoverCard from "./DiscoverCard";
import { urls } from "../../config/urls";
import { TrackScreen, track } from "../../analytics";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { AnalyticsContext } from "../../analytics/AnalyticsContext";
import { BaseNavigatorStackParamList } from "../../components/RootNavigator/types/BaseNavigator";
import { MainNavigatorParamList } from "../../components/RootNavigator/types/MainNavigator";
import useDynamicContent from "../../dynamicContent/dynamicContent";
import { useIsNewsfeedAvailable } from "../../hooks/newsfeed/useIsNewsfeedAvailable";

const images = {
  light: {
    learnImg: require("../../images/illustration/Light/_063.png"),
    appsImg: require("../../images/illustration/Light/_086.png"),
    earnImg: require("../../images/illustration/Light/_088.png"),
    mintImg: require("../../images/illustration/Light/_087.png"),
    referralImg: require("../../images/illustration/Light/_ReferralProgram.png"),
  },
  dark: {
    learnImg: require("../../images/illustration/Dark/_063.png"),
    appsImg: require("../../images/illustration/Dark/_086.png"),
    earnImg: require("../../images/illustration/Dark/_088.png"),
    mintImg: require("../../images/illustration/Dark/_087.png"),
    referralImg: require("../../images/illustration/Dark/_ReferralProgram.png"),
  },
};

const StyledSafeAreaView = styled(TabBarSafeAreaView)`
  background-color: ${({ theme }) => theme.colors.background.main};
`;

function Discover() {
  const { t } = useTranslation();
  const navigation =
    useNavigation<
      StackNavigationProp<BaseNavigatorStackParamList & MainNavigatorParamList>
    >();

  const learn = useFeature("brazeLearn");
  const isNewsfeedAvailable = useIsNewsfeedAvailable();
  const referralProgramConfig = useFeature("referralProgramDiscoverCard");
  const isNFTDisabled =
    useFeature("disableNftLedgerMarket")?.enabled && Platform.OS === "ios";

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

  const { learnCards } = useDynamicContent();
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
        ...(config?.enabled && config?.params.version === "2"
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
        ...(!learn?.enabled && !isNewsfeedAvailable
          ? [
              {
                title: t("discover.sections.learn.title"),
                subTitle: t("discover.sections.learn.desc"),
                onPress: () => {
                  readOnlyTrack("Learn");
                  track("Discover - Learn - OpenUrl", {
                    url: urls.discover.academy,
                  });
                  Linking.openURL(urls.discover.academy);
                },
                disabled: false,
                Image: (
                  <Illustration
                    size={110}
                    darkSource={images.dark.learnImg}
                    lightSource={images.light.learnImg}
                  />
                ),
              },
            ]
          : learnCards.length > 0 || isNewsfeedAvailable
          ? [
              {
                title: t("discover.sections.news.title"),
                subTitle: t("discover.sections.news.desc"),
                onPress: () => {
                  // Fixme: Can't find a way to make TS happy ...
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore
                  navigation.navigate(NavigatorName.ExploreTab);
                  track("banner_clicked", {
                    banner: "News",
                  });
                },
                disabled: false,
                Image: (
                  <Illustration
                    size={110}
                    darkSource={images.dark.learnImg}
                    lightSource={images.light.learnImg}
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
        ...(referralProgramConfig?.enabled && referralProgramConfig?.params.url
          ? [
              {
                title: t("discover.sections.referralProgram.title"),
                subTitle: t("discover.sections.referralProgram.desc"),
                onPress: () => {
                  readOnlyTrack("referralProgram");
                  track("Discover - Refer Program - OpenUrl", {
                    url: referralProgramConfig?.params.url,
                  });
                  Linking.openURL(referralProgramConfig?.params.url);
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
            ]
          : []),
      ].sort((a, b) => (b.disabled ? -1 : 0)),
    [
      t,
      learn?.enabled,
      learnCards,
      isNFTDisabled,
      referralProgramConfig?.enabled,
      referralProgramConfig?.params.url,
      navigation,
      readOnlyTrack,
      isNewsfeedAvailable,
      config,
    ],
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
    <StyledSafeAreaView>
      <TrackScreen category="Discover" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
      >
        <Flex p={8} mt={8} flexDirection="row">
          <Flex flex={1} justifyContent="flex-start" alignItems="flex-start">
            <Text variant="h1">{t("discover.title")}</Text>
            <Text variant="body" mb={4} mt={4} color="neutral.c70">
              {t("discover.desc")}
            </Text>
          </Flex>
        </Flex>
        {featuresList.map(
          ({ title, subTitle, onPress, disabled, labelBadge, Image }, i) => (
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
          ),
        )}
      </ScrollView>
    </StyledSafeAreaView>
  );
}

export default memo(Discover);
