import React from "react";
import { ServicesEntryPoints } from "@features/flow-portfolio-services-entry-points";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "LLD/utils/constants";
import { usePortfolioServicesEntryPointsViewModel } from "../../hooks/usePortfolioServicesEntryPointsViewModel";

export function PortfolioServicesEntryPoints() {
  const { onOpenService } = usePortfolioServicesEntryPointsViewModel();

  return <ServicesEntryPoints page={PORTFOLIO_TRACKING_PAGE_NAME} onOpenService={onOpenService} />;
}
