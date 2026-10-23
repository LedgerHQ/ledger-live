import React from "react";
import { ServicesEntryPoints } from "@features/flow-portfolio-services-entry-points";
import { ScreenName } from "~/const";
import { usePortfolioServicesSectionViewModel } from "./usePortfolioServicesSectionViewModel";

export const PortfolioServicesSection = () => {
  const { onOpenService } = usePortfolioServicesSectionViewModel();

  return <ServicesEntryPoints page={ScreenName.Portfolio} onOpenService={onOpenService} />;
};
