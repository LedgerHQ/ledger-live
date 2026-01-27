import React from "react";
import { Box } from "@ledgerhq/native-ui";
import { useTranslation } from "~/context/Locale";
import Carousel from "~/components/Carousel";
import SectionTitle from "~/screens/WalletCentricSections/SectionTitle";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";

interface PortfolioCarouselSectionProps {
  readonly backgroundColor: string;
}

export const PortfolioCarouselSection = ({ backgroundColor }: PortfolioCarouselSectionProps) => {
  const { t } = useTranslation();

  return (
    <Box background={backgroundColor} key="CarouselTitle">
      <SectionContainer px={0} minHeight={240} isFirst>
        <SectionTitle title={t("portfolio.carousel.title")} containerProps={{ mb: 7, mx: 6 }} />
        <Carousel />
      </SectionContainer>
    </Box>
  );
};
