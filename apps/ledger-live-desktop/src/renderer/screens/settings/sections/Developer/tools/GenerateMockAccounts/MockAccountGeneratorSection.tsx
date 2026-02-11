import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Flex, Text } from "@ledgerhq/react-ui/index";
import MockAccountGenerator from "./MockAccountGenerator";
import CustomMockAccountGenerator from "./CustomMockAccountGenerator";
import EmptyAccountGenerator from "./EmptyAccountGenerator";
import DeveloperExpandableRow from "../../components/DeveloperExpandableRow";

type MockAccountGeneratorSectionContentProps = {
  expanded: boolean;
};

export const MockAccountGeneratorSectionContent = ({
  expanded,
}: MockAccountGeneratorSectionContentProps) => {
  const { t } = useTranslation();

  return (
    <Flex flexDirection="column" pt={2} rowGap={2} alignSelf="stretch">
      <Text>{t("settings.developer.mockAccounts.description")}</Text>
      {expanded && (
        <Flex flexDirection="column" columnGap={4} mt={2} flexWrap="wrap">
          <CustomMockAccountGenerator
            title={t("settings.developer.mockAccounts.customGenerate.title")}
            desc={t("settings.developer.mockAccounts.customGenerate.desc")}
          />
          <MockAccountGenerator
            count={10}
            title={t("settings.developer.mockAccounts.quickGenerate.title")}
            desc={t("settings.developer.mockAccounts.quickGenerate.desc")}
          />
          <EmptyAccountGenerator
            title={t("settings.developer.mockAccounts.emptyGenerate.title")}
            desc={t("settings.developer.mockAccounts.emptyGenerate.desc")}
          />
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
    <DeveloperExpandableRow
      title={t("settings.developer.mockAccounts.title")}
      desc={<MockAccountGeneratorSectionContent expanded={contentExpanded} />}
      expanded={contentExpanded}
      onToggle={toggleContentVisibility}
      childrenAlignSelf="flex-start"
    />
  );
};

export default MockAccountGeneratorSection;
