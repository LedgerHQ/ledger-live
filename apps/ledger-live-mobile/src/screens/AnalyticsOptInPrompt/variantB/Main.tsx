import React, { memo } from "react";
import { Flex, Link, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import { View, Container, Titles, Content, Bottom, ScrollableContainer } from "../Common";
import headerAnalytics from "./illustrations/header_analytics.png";
import { Image } from "react-native";
import useAnalyticsOptInPrompt from "~/hooks/useAnalyticsOptInPromptVariantB";

function Main() {
  const { t } = useTranslation();
  const { clickOnAllowAnalytics, clickOnRefuseAnalytics, clickOnLearnMore } =
    useAnalyticsOptInPrompt();

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
        <TrackScreen category="Analytics Opt In Prompt" name="Main" variant="B" />
      </Container>
    </ScrollableContainer>
  );
}

export default memo(Main);
