import React, { memo } from "react";
import { Flex, Link, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import { View, Container, Titles, Content, Bottom } from "../Common";
import headerPersonalized from "./illustrations/header_personalized.png";
import { Image } from "react-native";
import useAnalyticsOptInPrompt from "~/hooks/useAnalyticsOptInPromptVariantB";

function Details() {
  const { t } = useTranslation();
  const {
    clickOnAllowPersonalizedExperience,
    clickOnRefusePersonalizedExperience,
    clickOnLearnMore,
  } = useAnalyticsOptInPrompt();

  const bulletPoints = [
    t("analyticsOptIn.variantB.details.bulletPoints.1"),
    t("analyticsOptIn.variantB.details.bulletPoints.2"),
  ];

  return (
    <Container alignItems="center">
      <View>
        <Image
          source={headerPersonalized}
          style={{ width: "100%", height: 180 }}
          resizeMode="contain"
        />
        <Titles>
          <Text variant="h3Inter" fontSize={24} fontWeight="semiBold" color="neutral.c100">
            {t("analyticsOptIn.variantB.details.title")}
          </Text>
        </Titles>
        <Content>
          <Text color="neutral.c80" fontSize={14}>
            {t("analyticsOptIn.variantB.details.description")}
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
            title={t("analyticsOptIn.variantB.details.ctas.refuse")}
            onPress={clickOnRefusePersonalizedExperience}
            type="shade"
            size="large"
            mr="2"
            flex={1}
          />
          <Button
            title={t("analyticsOptIn.variantB.details.ctas.allow")}
            onPress={clickOnAllowPersonalizedExperience}
            type="main"
            size="large"
            outline={false}
            ml="2"
            flex={1}
          />
        </Flex>
        <Text fontWeight="semiBold" pt={2} color="neutral.c70" textAlign="center" pb="2">
          {t("analyticsOptIn.variantB.details.infoText.info")}
        </Text>
        <Link size="small" type="color" onPress={clickOnLearnMore}>
          {t("analyticsOptIn.variantB.details.infoText.link")}
        </Link>
      </Bottom>
      <TrackScreen category="Analytics Opt In Prompt" name="Details" variant="B" />
    </Container>
  );
}

export default memo(Details);
