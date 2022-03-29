import React, { memo, useCallback, useMemo } from "react";
import { Linking, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Flex, Text, Link as TextLink } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import Illustration from "../../images/illustration/Illustration";
import { NavigatorName, ScreenName } from "../../const";
import DiscoverCard from "./DiscoverCard";
import { urls } from "../../config/urls";

const discoverImg = {
  dark: require("../../images/illustration/Dark/_030.png"),
  light: require("../../images/illustration/Light/_030.png"),
};

const learnImg = {
  dark: require("../../images/illustration/Dark/_Learn.png"),
  light: require("../../images/illustration/Light/_Learn.png"),
};

const appsImg = {
  dark: require("../../images/illustration/Dark/_Apps.png"),
  light: require("../../images/illustration/Light/_Apps.png"),
};

const earnImg = {
  dark: require("../../images/illustration/Dark/_Earn.png"),
  light: require("../../images/illustration/Light/_Earn.png"),
};

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  backgroundcolor: ${({ theme }) => theme.colors.background.main};
`;

function Discover() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onTellMeMore = useCallback(() => {
    Linking.openURL(urls.discover.academy);
  }, []);

  const learn = useFeature("learn");

  const featuresList = useMemo(
    () =>
      [
        {
          title: t("discover.sections.learn.title"),
          subTitle: t("discover.sections.learn.desc"),
          onPress: () => {
            // TODO: FIX @react-navigation/native using Typescript
            // @ts-ignore next-line
            navigation.navigate(ScreenName.Learn);
          },
          disabled: !learn?.enabled,
          labelBadge: !learn?.enabled ? t("discover.comingSoon") : undefined,
          Image: (
            <Illustration
              size={130}
              darkSource={learnImg.dark}
              lightSource={learnImg.light}
            />
          ),
        },
        {
          title: t("discover.sections.ledgerApps.title"),
          subTitle: t("discover.sections.ledgerApps.desc"),
          onPress: () => {
            if (Platform.OS !== "ios") {
              // TODO: FIX @react-navigation/native using Typescript
              // @ts-ignore next-line
              navigation.navigate(NavigatorName.Discover, {
                screen: ScreenName.PlatformCatalog,
              });
            } else Linking.openURL(urls.discover.ledgerApps);
          },
          Image: (
            <Illustration
              size={130}
              darkSource={appsImg.dark}
              lightSource={appsImg.light}
            />
          ),
        },
        {
          title: t("discover.sections.earn.title"),
          subTitle: t("discover.sections.earn.desc"),
          onPress: () => {
            Linking.openURL(urls.discover.earn);
          },
          labelBadge: t("discover.mostPopular"),
          Image: (
            <Illustration
              size={130}
              darkSource={earnImg.dark}
              lightSource={earnImg.light}
            />
          ),
        },
      ].sort((a, b) => (b.disabled ? -1 : 0)),
    [learn?.enabled, navigation, t],
  );

  return (
    <StyledSafeAreaView>
      <ScrollView>
        <Flex p={8} mt={8} flexDirection="row">
          <Flex flex={1} justyfyContent="flex-start" alignItems="flex-start">
            <Text variant="h1">{t("discover.title")}</Text>
            <Text variant="body" mb={6} mt={4} color="neutral.c90">
              {t("discover.desc")}
            </Text>
            <TextLink type="color" onPress={onTellMeMore}>
              {t("discover.link")}
            </TextLink>
          </Flex>
          <Flex flex={1} justifyContent="flex-end" alignItems="flex-end">
            <Illustration
              size={130}
              darkSource={discoverImg.dark}
              lightSource={discoverImg.light}
            />
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
              Image={Image}
            />
          ),
        )}
      </ScrollView>
    </StyledSafeAreaView>
  );
}

export default memo(Discover);
