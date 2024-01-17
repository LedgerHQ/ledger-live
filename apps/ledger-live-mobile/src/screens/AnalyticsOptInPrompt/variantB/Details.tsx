import React, { memo } from "react";
import styled from "styled-components/native";
import { Flex, IconsLegacy, Link, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "react-i18next";
import Button from "~/components/Button";

const Container = styled(Flex).attrs({
  paddingVertical: 20,
  paddingHorizontal: 16,
  flex: 1,
  justifyContent: "space-between",
})``;

const View = styled(Flex).attrs({
  width: "100%",
})``;

const Image = styled(Flex).attrs({
  width: "100%",
  height: 180,
  backgroundColor: "primary.c30",
  borderRadius: "24px",
})``;

const Titles = styled(Flex).attrs({
  pt: 6,
  width: "100%",
})``;

const Content = styled(Flex).attrs({
  pt: 6,
  width: "100%",
})``;

const Bottom = styled(Flex).attrs({
  paddingBottom: 7,
  paddingTop: 0,
  width: "100%",
})``;

function Details() {
  const { t } = useTranslation();

  const bulletPoints = [
    t("analyticsOptIn.variantB.details.bulletPoints.1"),
    t("analyticsOptIn.variantB.details.bulletPoints.2"),
  ];

  return (
    <Container alignItems="center">
      <View>
        <Image />
        <Titles>
          <Text variant="h3Inter" fontSize={24} fontWeight="semiBold" color="neutral.c100">
            {t("analyticsOptIn.variantB.details.title")}
          </Text>
        </Titles>
        <Content>
          <Text color="neutral.c80" fontSize={14}>
            {t("analyticsOptIn.variantB.details.description")}
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
            title={t("analyticsOptIn.variantB.details.ctas.refuse")}
            onPress={() => {}}
            type="secondary"
            size="large"
            mr="2"
            flex={1}
          />
          <Button
            title={t("analyticsOptIn.variantB.details.ctas.allow")}
            onPress={() => {}}
            type="main"
            size="large"
            outline={false}
            ml="2"
            flex={1}
          />
        </Flex>
        <Text variant="small" pt={2} color="neutral.c70" textAlign="center" pb="2">
          {t("analyticsOptIn.variantB.details.infoText.info")}
        </Text>
        <Link
          size="small"
          type="color"
          onPress={() => {}}
          Icon={IconsLegacy.ExternalLinkMedium}
          iconPosition="left"
        >
          {t("analyticsOptIn.variantB.details.infoText.link")}
        </Link>
      </Bottom>
      <TrackScreen category="Analytics Opt In Prompt" name="Details" />
    </Container>
  );
}

export default memo(Details);
