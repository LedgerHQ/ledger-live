import React, { memo, useCallback, useMemo, useContext } from "react";
import { Linking, Platform, ScrollView } from "react-native";
import styled from "styled-components/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import Illustration from "../../images/illustration/Illustration";
import { NavigatorName, ScreenName } from "../../const";
import DiscoverCard from "./DiscoverCard";
import { urls } from "../../config/urls";
// @ts-ignore issue with exports
import { TrackScreen, track } from "../../analytics";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { AnalyticsContext } from "../../components/RootNavigator";

const learnImg = require("../../images/illustration/Shared/_Learn.png");

const appsImg = require("../../images/illustration/Shared/_Apps.png");

const earnImg = require("../../images/illustration/Shared/_Earn.png");

const mintImg = require("../../images/illustration/Shared/_Mint.png");

const StyledSafeAreaView = styled(TabBarSafeAreaView)`
  background-color: ${({ theme }) => theme.colors.background.main};
`;

function Discover() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const learn = useFeature("learn");

  const readOnlyTrack = useCallback((bannerName: string) => {
    track("banner_clicked", {
      banner: `Dapp_${bannerName}`,
      screen: "Discover",
    });
  }, []);

  const featuresList: {
    title: string;
    titleProps?: any;
    subTitle?: string;
    subTitleProps?: any;
    labelBadge?: string;
    Image: React.ReactNode;
    onPress: () => void;
    disabled?: boolean;
  }[] = useMemo(
    () =>
      [
        ...(Platform.OS !== "ios"
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
                    size={130}
                    darkSource={appsImg}
                    lightSource={appsImg}
                  />
                ),
              },
            ]
          : []),
        {
          title: t("discover.sections.learn.title"),
          subTitle: t("discover.sections.learn.desc"),
          onPress: () => {
            readOnlyTrack("Learn");
            if (!learn?.enabled) {
              track("Discover - Learn - OpenUrl", {
                url: urls.discover.academy,
              });
              Linking.openURL(urls.discover.academy);
            } else {
              // TODO: FIX @react-navigation/native using Typescript
              // @ts-ignore next-line
              navigation.navigate(ScreenName.Learn);
            }
          },
          disabled: false,
          Image: (
            <Illustration
              size={130}
              darkSource={learnImg}
              lightSource={learnImg}
            />
          ),
        },
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
              size={130}
              darkSource={earnImg}
              lightSource={earnImg}
            />
          ),
        },
        {
          title: t("discover.sections.mint.title"),
          subTitle: t("discover.sections.mint.desc"),
          onPress: () => {
            readOnlyTrack("Mint");
            track("Discover - Mint - OpenUrl", { url: urls.discover.mint });
            Linking.openURL(urls.discover.mint);
          },
          disabled: false,
          Image: (
            <Illustration
              size={130}
              darkSource={mintImg}
              lightSource={mintImg}
            />
          ),
        },
      ].sort((a, b) => (b.disabled ? -1 : 0)),
    [learn?.enabled, navigation, readOnlyTrack, t],
  );

  const { setSource, setScreen } = useContext(AnalyticsContext);

  useFocusEffect(
    useCallback(() => {
      setScreen("Discover");

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
          <Flex flex={1} justyfyContent="flex-start" alignItems="flex-start">
            <Text variant="h1">{t("discover.title")}</Text>
            <Text variant="body" mb={4} mt={4} color="neutral.c70">
              {t("discover.desc")}
            </Text>
          </Flex>
          <Flex flex={1} />
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
              Image={Image}
            />
          ),
        )}
      </ScrollView>
    </StyledSafeAreaView>
  );
}

export default memo(Discover);
