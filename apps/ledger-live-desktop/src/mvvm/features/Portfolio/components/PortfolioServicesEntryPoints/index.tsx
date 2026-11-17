import React from "react";
import { ServicesEntryPoints } from "@features/flow-portfolio-services-entry-points";
import { HorizontalScroll } from "LLD/components/HorizontalScroll";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";
import { usePortfolioServicesEntryPointsViewModel } from "./usePortfolioServicesEntryPointsViewModel";

export function PortfolioServicesEntryPoints() {
  const { onOpenService } = usePortfolioServicesEntryPointsViewModel();

  return (
    <HorizontalScroll
      scrollContainerTestId="portfolio-services-entry-points-scroll-container"
      scrollContainerClassName="py-2"
    >
      <ServicesEntryPoints page={PORTFOLIO_TRACKING_PAGE_NAME} onOpenService={onOpenService} />
    </HorizontalScroll>
  );
}
