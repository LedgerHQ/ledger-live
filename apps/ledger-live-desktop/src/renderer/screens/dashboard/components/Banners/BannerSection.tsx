import React from "react";
import { PortfolioBannerContent } from "./PortfolioBannerContent";
import { TopBannerAlerts } from "./TopBannerAlerts";

export default function BannerSection({
  topBannerAlerts = true,
  portfolioBannerContent = true,
}: {
  topBannerAlerts?: boolean;
  portfolioBannerContent?: boolean;
}) {
  return (
    <section>
      {topBannerAlerts && <TopBannerAlerts />}
      {portfolioBannerContent && <PortfolioBannerContent />}
    </section>
  );
}
