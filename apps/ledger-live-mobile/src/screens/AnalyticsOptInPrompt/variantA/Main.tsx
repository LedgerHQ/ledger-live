import React, { memo } from "react";
import { Flex, Link, Text } from "@ledgerhq/native-ui";
import { TrackScreen } from "~/analytics";
import { useTranslation } from "react-i18next";
import { Check, Close } from "@ledgerhq/native-ui/assets/icons";
import Button from "~/components/Button";
import { View, Container, Titles, Content, Bottom } from "../Common";
import useAnalyticsOptInPrompt from "~/hooks/useAnalyticsOptInPromptVariantA";

interface RenderItemsProps {
  items: string[];
  IconComponent: React.ReactElement;
}

function renderItems({ items, IconComponent }: RenderItemsProps): React.ReactElement {
  return (
    <Flex>
      {items.map((item, index) => {
        return (
          <Flex pt="6" key={index} flexDirection={"row"} alignItems="flex-start">
            <Flex mr={3}>{IconComponent}</Flex>
            <Text pt={2} color="neutral.c100">
              {item}
            </Text>
          </Flex>
        );
      })}
    </Flex>
  );
}

function Main() {
  const { t } = useTranslation();
  const { navigateToMoreOptions, clickOnRefuseAll, clickOnAcceptAll, clickOnLearnMore } =
    useAnalyticsOptInPrompt();

  const trackable = [t("analyticsOptIn.variantA.main.content.able.diagAndUsage")];

  const unTrackable = [
    t("analyticsOptIn.variantA.main.content.unable.adresses"),
    t("analyticsOptIn.variantA.main.content.unable.balance"),
    t("analyticsOptIn.variantA.main.content.unable.nfts"),
    t("analyticsOptIn.variantA.main.content.unable.personnalInfos"),
  ];

  return (
    <Container alignItems="center">
      <View>
        <Titles>
          <Text variant="h3Inter" fontSize={24} fontWeight="semiBold" color="neutral.c100">
            {t("analyticsOptIn.variantA.main.title")}
          </Text>
          <Text pt={2} fontSize={14} color="neutral.c80">
            {t("analyticsOptIn.variantA.main.subtitle")}
          </Text>
        </Titles>
        <Content>
          <Flex>
            <Text pt={2} color="neutral.c70">
              {t("analyticsOptIn.variantA.main.content.able.title")}
            </Text>
            {renderItems({
              items: trackable,
              IconComponent: <Check size="M" color="success.c70" />,
            })}
          </Flex>
          <Flex pt="7">
            <Text pt={2} color="neutral.c70">
              {t("analyticsOptIn.variantA.main.content.unable.title")}
            </Text>
            {renderItems({
              items: unTrackable,
              IconComponent: <Close size="M" color="neutral.c70" />,
            })}
          </Flex>
        </Content>
      </View>
      <Bottom>
        <Flex flexDirection="row" justifyContent="center">
          <Link type="color" onPress={navigateToMoreOptions}>
            {t("analyticsOptIn.variantA.main.content.moreOptions")}
          </Link>
        </Flex>
        <Flex flexDirection="row" py="20px">
          <Button
            title={t("analyticsOptIn.variantA.main.content.ctas.refuse")}
            onPress={clickOnRefuseAll}
            type="shade"
            size="large"
            mr="2"
            flex={1}
          />
          <Button
            title={t("analyticsOptIn.variantA.main.content.ctas.accept")}
            onPress={clickOnAcceptAll}
            type="main"
            size="large"
            outline={false}
            ml="2"
            flex={1}
          />
        </Flex>
        <Text fontWeight="semiBold" pt={2} color="neutral.c70" textAlign="center" pb="2">
          {t("analyticsOptIn.variantA.main.content.infoText.info")}
        </Text>
        <Link size="small" type="color" onPress={clickOnLearnMore}>
          {t("analyticsOptIn.variantA.main.content.infoText.link")}
        </Link>
      </Bottom>
      <TrackScreen category="Analytics Opt In Prompt" name="Main" variant="A" />
    </Container>
  );
}

export default memo(Main);
