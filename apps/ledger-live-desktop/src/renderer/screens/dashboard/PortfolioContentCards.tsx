import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Carousel } from "@ledgerhq/react-ui";
import { ABTestingVariants } from "@ledgerhq/types-live";
import React from "react";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components";
import { useRefreshAccountsOrderingEffect } from "~/renderer/actions/general";
import { Card } from "~/renderer/components/Box";
import usePortfolioCards from "~/renderer/hooks/usePortfolioCards";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { hasInstalledAppsSelector } from "~/renderer/reducers/settings";

const PortfolioContentCards = () => {
  const theme = useTheme();
  const slides = usePortfolioCards();
  const lldPortfolioCarousel = useFeature("lldPortfolioCarousel");
  const accounts = useSelector(accountsSelector);
  const hasInstalledApps = useSelector(hasInstalledAppsSelector);
  const totalAccounts = accounts.length;

  const showCarousel = hasInstalledApps && totalAccounts >= 0;
  useRefreshAccountsOrderingEffect({
    onMount: true,
  });

  return showCarousel && lldPortfolioCarousel?.enabled ? (
    lldPortfolioCarousel?.params?.variant === ABTestingVariants.variantA ? (
      <Card style={{ backgroundColor: theme.colors.opacityPurple.c10 }}>
        <Carousel variant="content-card" children={slides} />
      </Card>
    ) : (
      <div
        style={{
          position: "fixed",
          bottom: "30px",
          left: "20px",
          width: "97.5%",
          zIndex: 10000,
          backdropFilter: "blur(15px)",
          borderRadius: "8px",
          backgroundColor: theme.colors.opacityPurple.c10,
        }}
      >
        <Carousel variant="content-card" children={slides} />
      </div>
    )
  ) : null;
};

export default PortfolioContentCards;
