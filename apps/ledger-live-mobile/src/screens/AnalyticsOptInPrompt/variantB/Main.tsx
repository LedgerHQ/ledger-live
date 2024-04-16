import React, { memo, useEffect } from "react";
import { Flex, Link, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import { View, Container, Titles, Content, Bottom, ScrollableContainer } from "../Common";
import headerAnalytics from "./illustrations/header_analytics.png";
import { Image } from "react-native";
import useAnalyticsOptInPromptLogic from "~/hooks/analyticsOptInPrompt/useAnalyticsOptInPromptLogicVariantB";
import { StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { AnalyticsOptInPromptNavigatorParamList } from "~/components/RootNavigator/types/AnalyticsOptInPromptNavigator";
import { ScreenName } from "~/const";

type Props = StackNavigatorProps<
  AnalyticsOptInPromptNavigatorParamList,
  ScreenName.AnalyticsOptInPromptMain
>;

function Main({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { entryPoint } = route.params;
  const { shouldWeTrack, clickOnAllowAnalytics, clickOnRefuseAnalytics, clickOnLearnMore, flow } =
    useAnalyticsOptInPromptLogic({ entryPoint });

  const shouldPreventBackNavigation = entryPoint === "Portfolio";

  useEffect(() => {
    if (shouldPreventBackNavigation) {
      const unsubscribe = navigation.addListener("beforeRemove", e => {
        e.preventDefault();
      });

      return unsubscribe;
    }
  });

  const bulletPoints = [
    t("analyticsOptIn.variantB.main.bulletPoints.1"),
    t("analyticsOptIn.variantB.main.bulletPoints.2"),
    t("analyticsOptIn.variantB.main.bulletPoints.3"),
  ];

  return (
    <ScrollableContainer>
      <Container alignItems="center">
        <View>
          <Image
            source={headerAnalytics}
            style={{ width: "100%", height: 180 }}
            resizeMode="contain"
          />
          <Titles>
            <Text variant="h3Inter" fontSize={24} fontWeight="semiBold" color="neutral.c100">
              {t("analyticsOptIn.variantB.main.title")}
            </Text>
          </Titles>
          <Content>
            <Text color="neutral.c80" fontSize={14}>
              {t("analyticsOptIn.variantB.main.description")}
            </Text>
            <Flex pl={2}>
              {bulletPoints.map((item, index) => (
                <View key={index}>
                  <Text pt={6} color="neutral.c80" fontSize={14}>{`\u2022 ${item}`}</Text>
                </View>
              ))}
            </Flex>
          </Content>
        </View>
        <Bottom>
          <Flex flexDirection="row" py="20px">
            <Button
              title={t("analyticsOptIn.variantB.main.ctas.refuse")}
              onPress={clickOnRefuseAnalytics}
              type="shade"
              size="large"
              mr="2"
              flex={1}
            />
            <Button
              title={t("analyticsOptIn.variantB.main.ctas.share")}
              onPress={clickOnAllowAnalytics}
              type="main"
              size="large"
              outline={false}
              ml="2"
              flex={1}
            />
          </Flex>
          <Text fontWeight="semiBold" pt={2} color="neutral.c70" textAlign="center" pb="2">
            {t("analyticsOptIn.variantB.main.infoText.info")}
          </Text>
          <Link size="small" type="color" onPress={clickOnLearnMore}>
            {t("analyticsOptIn.variantB.main.infoText.link")}
          </Link>
        </Bottom>
        <TrackScreen
          category="Analytics Opt In Prompt"
          name="Main"
          variant="B"
          flow={flow}
          mandatory={shouldWeTrack}
        />
      </Container>
    </ScrollableContainer>
  );
}

export default memo(Main);
