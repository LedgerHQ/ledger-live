import React from "react";
import { Flex } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import SectionTitle from "~/screens/WalletCentricSections/SectionTitle";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import AllocationsSection from "~/screens/WalletCentricSections/Allocations";

interface PortfolioAllocationsSectionProps {
  readonly isFirst: boolean;
  readonly onPress: () => void;
}

export const PortfolioAllocationsSection = ({
  isFirst,
  onPress,
}: PortfolioAllocationsSectionProps) => {
  const { t } = useTranslation();

  return (
    <SectionContainer px={6} isFirst={isFirst} key="AllocationsSection">
      <SectionTitle title={t("analytics.allocation.title")} testID="portfolio-allocation-section" />
      <Flex minHeight={94}>
        <AllocationsSection screenName="Wallet" onPress={onPress} />
      </Flex>
    </SectionContainer>
  );
};
