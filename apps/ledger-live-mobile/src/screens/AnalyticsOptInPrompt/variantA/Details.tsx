import React, { memo } from "react";
import styled from "styled-components/native";
import { Flex, IconsLegacy, Link, Text, Toggle } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "react-i18next";
import { Check, Close } from "@ledgerhq/native-ui/assets/icons";
import Button from "~/components/Button";
import Switch from "~/components/Switch";

const Container = styled(Flex).attrs({
  paddingVertical: 20,
  paddingHorizontal: 16,
  flex: 1,
  justifyContent: "space-between",
})``;

const View = styled(Flex).attrs({
  width: "100%",
})``;

const Titles = styled(Flex).attrs({
  py: 3,
  width: "100%",
})``;

const Content = styled(Flex).attrs({
  py: 6,
  width: "100%",
})``;

const Bottom = styled(Flex).attrs({
  paddingBottom: 7,
  paddingTop: 0,
  width: "100%",
})``;

const OptionContainer = styled(Flex).attrs({
  width: "100%",
  alignItems: "flex-start",
})``;

const OptionRow = styled(Flex).attrs({
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "opacityDefault.c05",
  borderRadius: 12,
  width: "100%",
  padding: 4,
})``;

interface OptionProps {
  title: string;
  description: string;
  link: string;
  checked: boolean;
  onToggle?: (_: boolean) => void;
}

function Option({ title, description, link, checked, onToggle }: OptionProps): React.ReactElement {
  return (
    <OptionContainer>
      <OptionRow>
        <Text variant="large" fontWeight="medium" color="neutral.c100">
          {title}
        </Text>
        <Switch value={checked} onChange={onToggle} />
      </OptionRow>
      <Text fontSize={14} pt={4} pb={2} color="neutral.c70">
        {description}
      </Text>
      <Link size="small" type="color" onPress={() => {}}>
        {link}
      </Link>
    </OptionContainer>
  );
}

function Details() {
  const { t } = useTranslation();

  return (
    <Container alignItems="center">
      <View>
        <Titles>
          <Text variant="h3Inter" fontSize={24} fontWeight="semiBold" color="neutral.c100">
            {t("analyticsOptIn.variantA.details.title")}
          </Text>
        </Titles>
        <Content>
          <Option
            title={t("analyticsOptIn.variantA.details.analytics.title")}
            description={t("analyticsOptIn.variantA.details.analytics.description")}
            link={t("analyticsOptIn.variantA.details.analytics.link")}
            checked={false}
            onToggle={() => {}}
          />
          <Flex pt={7}>
            <Option
              title={t("analyticsOptIn.variantA.details.personalizedExp.title")}
              description={t("analyticsOptIn.variantA.details.personalizedExp.description")}
              link={t("analyticsOptIn.variantA.details.personalizedExp.link")}
              checked={true}
              onToggle={() => {}}
            />
          </Flex>
        </Content>
      </View>
      <Bottom>
        <Flex flexDirection="row" py="20px">
          <Button
            title={t("analyticsOptIn.variantA.details.ctas.notNow")}
            onPress={() => {}}
            type="secondary"
            size="large"
            mr="2"
            flex={1}
          />
          <Button
            title={t("analyticsOptIn.variantA.details.ctas.allow")}
            onPress={() => {}}
            type="main"
            size="large"
            outline={false}
            ml="2"
            flex={1}
          />
        </Flex>
        <Text variant="small" pt={2} color="neutral.c70" textAlign="center" pb="2">
          {t("analyticsOptIn.variantA.details.infoText.info")}
        </Text>
        <Link
          size="small"
          type="color"
          onPress={() => {}}
          Icon={IconsLegacy.ExternalLinkMedium}
          iconPosition="left"
        >
          {t("analyticsOptIn.variantA.details.infoText.link")}
        </Link>
      </Bottom>
      <TrackScreen category="Analytics Opt In Prompt" name="Details" />
    </Container>
  );
}

export default memo(Details);
