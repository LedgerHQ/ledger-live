import React from "react";
import { Spot, Tile, TileContent, TileDescription, TileTitle } from "@ledgerhq/lumen-ui-react";
import { CoinStacked, Infinite } from "@ledgerhq/lumen-ui-react/symbols";
import { useTranslation } from "@shared/i18n";
import type { ServiceEntryPointId } from "../../types";
import type { ServicesEntryPointsViewProps } from "./ServicesEntryPointsView.types";

const ICONS = {
  perps: Infinite,
  borrow: CoinStacked,
} as const satisfies Record<ServiceEntryPointId, unknown>;

export function ServicesEntryPointsView({
  services,
  onPressService,
}: ServicesEntryPointsViewProps) {
  const { t } = useTranslation();

  if (services.length === 0) return null;

  return (
    <div className="flex gap-12" data-testid="portfolio-services-entry-points">
      {services.map(service => (
        <Tile
          key={service}
          appearance="card"
          className="flex-1"
          data-testid={`portfolio-services-entry-point-${service}`}
          onClick={() => onPressService(service)}
        >
          <Spot icon={ICONS[service]} />
          <TileContent>
            <TileTitle>{t(`servicesEntryPoints.${service}.title`)}</TileTitle>
            <TileDescription>{t(`servicesEntryPoints.${service}.description`)}</TileDescription>
          </TileContent>
        </Tile>
      ))}
    </div>
  );
}
