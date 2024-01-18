import React, { memo } from "react";
import styled from "styled-components/native";
import { Flex, IconsLegacy, Link, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";
import { View, Container, Titles, Content, Bottom } from "../Common";

const Image = styled(Flex).attrs({
  width: "100%",
  height: 180,
  backgroundColor: "primary.c30",
  borderRadius: "24px",
})``;

function Main() {
  const { t } = useTranslation();

  const bulletPoints = [
    t("analyticsOptIn.variantB.main.bulletPoints.1"),
    t("analyticsOptIn.variantB.main.bulletPoints.2"),
    t("analyticsOptIn.variantB.main.bulletPoints.3"),
  ];

  return (
    <Container alignItems="center">
      <View>
        <Image />
        <Titles>
          <Text variant="h3Inter" fontSize={24} fontWeight="semiBold" color="neutral.c100">
            {t("analyticsOptIn.variantB.main.title")}
          </Text>
        </Titles>
        <Content>
          <Text color="neutral.c80" fontSize={14}>
            {t("analyticsOptIn.variantB.main.description")}
          </Text>
          {bulletPoints.map((item, index) => (
            <View key={index}>
              <Text pt={6} color="neutral.c80" fontSize={14}>{`\u2022 ${item}`}</Text>
            </View>
          ))}
        </Content>
      </View>
      <Bottom>
        <Flex flexDirection="row" py="20px">
          <Button
            title={t("analyticsOptIn.variantB.main.ctas.refuse")}
            onPress={() => {}}
            type="secondary"
            size="large"
            mr="2"
            flex={1}
          />
          <Button
            title={t("analyticsOptIn.variantB.main.ctas.share")}
            onPress={() => {}}
            type="main"
            size="large"
            outline={false}
            ml="2"
            flex={1}
          />
        </Flex>
        <Text variant="small" pt={2} color="neutral.c70" textAlign="center" pb="2">
          {t("analyticsOptIn.variantB.main.infoText.info")}
        </Text>
        <Link
          size="small"
          type="color"
          onPress={() => {}}
          Icon={IconsLegacy.ExternalLinkMedium}
          iconPosition="left"
        >
          {t("analyticsOptIn.variantB.main.infoText.link")}
        </Link>
      </Bottom>
      <TrackScreen category="Analytics Opt In Prompt" name="Main" />
    </Container>
  );
}

export default memo(Main);
