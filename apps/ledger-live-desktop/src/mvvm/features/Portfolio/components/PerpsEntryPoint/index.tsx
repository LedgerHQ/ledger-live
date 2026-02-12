import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { PiggyBank } from "@ledgerhq/lumen-ui-react/symbols";
import FeatureToggle from "@ledgerhq/live-common/featureFlags/FeatureToggle";
import {
  ListItem,
  ListItemLeading,
  ListItemSpot,
  ListItemContent,
  ListItemTitle,
  ListItemTrailing,
  Button,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-react";
import { track } from "~/renderer/analytics/segment";
import { PORTFOLIO_TRACKING_PAGE_NAME } from "../../utils/constants";

export const PerpsEntryPoint = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const handleClick = useCallback(() => {
    track("button_clicked", {
      button: "perps_entry_point",
      flow: "perps",
      page: PORTFOLIO_TRACKING_PAGE_NAME,
    });
    navigate("/perps");
  }, [navigate]);

  return (
    <FeatureToggle featureId="ptxPerpsLiveApp">
      <div className="flex flex-col gap-12" data-testid="portfolio-perps-entry-point">
        <Subheader>
          <SubheaderRow onClick={handleClick} data-testid="portfolio-perps-subheader-row">
            <SubheaderTitle>{t("portfolio.perpsEntry.title")}</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
        <ListItem onClick={handleClick} className="rounded-md bg-surface">
          <ListItemLeading>
            <ListItemSpot appearance="icon" icon={PiggyBank} />
            <ListItemContent>
              <ListItemTitle>{t("portfolio.perpsEntry.description")}</ListItemTitle>
            </ListItemContent>
          </ListItemLeading>
          <ListItemTrailing>
            <Button appearance="base" size="sm" onClick={handleClick}>
              {t("portfolio.perpsEntry.cta")}
            </Button>
          </ListItemTrailing>
        </ListItem>
      </div>
    </FeatureToggle>
  );
};
