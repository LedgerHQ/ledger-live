import React, { memo, useCallback, useMemo } from "react";
import { Linking, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import styled from "styled-components/native";
import { Flex, Text, Link as TextLink, Icons } from "@ledgerhq/native-ui";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import useFeature from "@ledgerhq/live-common/lib/featureFlags/useFeature";
import Illustration from "../../images/illustration/Illustration";
import { NavigatorName, ScreenName } from "../../const";
import DiscoverCard from "./DiscoverCard";
import { urls } from "../../config/urls";

const learnImg = require("../../images/illustration/Shared/_Learn.png");

const appsImg = require("../../images/illustration/Shared/_Apps.png");

const earnImg = require("../../images/illustration/Shared/_Earn.png");

const StyledSafeAreaView = styled(SafeAreaView)`
  flex: 1;
  backgroundcolor: ${({ theme }) => theme.colors.background.main};
`;

function Discover() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const onTellMeMore = useCallback(() => {
    Linking.openURL(urls.discover.tellMeMore);
  }, []);

  const learn = useFeature("learn");

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
          disabled: false,
          Image: (
            <Illustration
              size={130}
              darkSource={appsImg}
              lightSource={appsImg}
            />
          ),
        },
        {
          title: t("discover.sections.learn.title"),
          subTitle: t("discover.sections.learn.desc"),
          onPress: () => {
            if (!learn?.enabled) {
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
      ].sort((a, b) => (b.disabled ? -1 : 0)),
    [learn?.enabled, navigation, t],
  );

  return (
    <StyledSafeAreaView>
      <ScrollView>
        <Flex p={8} mt={8} flexDirection="row">
          <Flex flex={1} justyfyContent="flex-start" alignItems="flex-start">
            <Text variant="h1">{t("discover.title")}</Text>
            <Text variant="body" mb={6} mt={4} color="neutral.c70">
              {t("discover.desc")}
            </Text>
            <TextLink
              type="color"
              onPress={onTellMeMore}
              Icon={Icons.ArrowRightMedium}
            >
              {t("discover.link")}
            </TextLink>
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
