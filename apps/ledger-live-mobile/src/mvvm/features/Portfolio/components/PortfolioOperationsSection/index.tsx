import React from "react";
import { useTranslation } from "~/context/Locale";
import SectionTitle from "~/screens/WalletCentricSections/SectionTitle";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import PortfolioOperationsHistorySection from "~/screens/Portfolio/PortfolioOperationsHistorySection";

export const PortfolioOperationsSection = () => {
  const { t } = useTranslation();

  return (
    <SectionContainer px={6} key="PortfolioOperationsHistorySection" isFirst>
      <SectionTitle
        title={t("analytics.operations.title")}
        testID="portfolio-transaction-history-section"
      />
      <PortfolioOperationsHistorySection />
    </SectionContainer>
  );
};
