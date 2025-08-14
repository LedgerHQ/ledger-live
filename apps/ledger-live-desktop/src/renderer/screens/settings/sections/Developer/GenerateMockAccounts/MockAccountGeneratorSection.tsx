import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import { SettingsSectionRow as Row } from "../../../SettingsSection";
import ButtonV2 from "~/renderer/components/Button";
import MockAccountGenerator from "./MockAccountGenerator";
import CustomMockAccountGenerator from "./CustomMockAccountGenerator";
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";
import GenerateMockAccountsWithNfts from "../NftsTools/screens/GeneratorsAndDestructors/GenerateMockAccountsWithNfts";

type MockAccountGeneratorSectionContentProps = {
  expanded: boolean;
};

export const MockAccountGeneratorSectionContent = ({
  expanded,
}: MockAccountGeneratorSectionContentProps) => {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <Text>{t("settings.developer.debugSimpleHash.mockAccounts.description")}</Text>
      {expanded && (
        <Flex flexDirection="column" columnGap={4} mt={2} flexWrap="wrap">
          <CustomMockAccountGenerator
            title={t("settings.developer.debugSimpleHash.mockAccounts.customGenerate.title")}
            desc={t("settings.developer.debugSimpleHash.mockAccounts.customGenerate.desc")}
          />
          <MockAccountGenerator
            count={10}
            title={t("settings.developer.debugSimpleHash.mockAccounts.quickGenerate.title")}
            desc={t("settings.developer.debugSimpleHash.mockAccounts.quickGenerate.desc")}
          />
          <FeatureToggle featureId="llNftSupport">
            <GenerateMockAccountsWithNfts />
          </FeatureToggle>
        </Flex>
      )}
    </Flex>
  );
};

const MockAccountGeneratorSection = () => {
  const { t } = useTranslation();
  const [contentExpanded, setContentExpanded] = useState(false);

  const toggleContentVisibility = useCallback(() => {
    setContentExpanded(!contentExpanded);
  }, [contentExpanded]);

  return (
    <Row
      title={t("settings.developer.debugSimpleHash.mockAccounts.title")}
      descContainerStyle={{ maxWidth: undefined }}
      contentContainerStyle={{ marginRight: 0 }}
      childrenContainerStyle={{ alignSelf: "flex-start" }}
      desc={<MockAccountGeneratorSectionContent expanded={contentExpanded} />}
    >
      <ButtonV2 small primary onClick={toggleContentVisibility}>
        {contentExpanded ? t("settings.developer.hide") : t("settings.developer.show")}
      </ButtonV2>
    </Row>
  );
};

export default MockAccountGeneratorSection;
