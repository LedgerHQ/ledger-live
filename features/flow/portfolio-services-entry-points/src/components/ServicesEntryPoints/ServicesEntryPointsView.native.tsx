import React from "react";
import {
  Box,
  Spot,
  Tile,
  TileContent,
  TileDescription,
  TileTitle,
} from "@ledgerhq/lumen-ui-rnative";
import { CoinStacked, Infinite } from "@ledgerhq/lumen-ui-rnative/symbols";
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
    <Box lx={{ flexDirection: "row", gap: "s12" }} testID="portfolio-services-entry-points">
      {services.map(service => (
        <Tile
          key={service}
          appearance="card"
          lx={{ flex: 1 }}
          testID={`portfolio-services-entry-point-${service}`}
          onPress={() => onPressService(service)}
        >
          <Spot icon={ICONS[service]} />
          <TileContent>
            <TileTitle>{t(`servicesEntryPoints.${service}.title`)}</TileTitle>
            <TileDescription>{t(`servicesEntryPoints.${service}.description`)}</TileDescription>
          </TileContent>
        </Tile>
      ))}
    </Box>
  );
}
