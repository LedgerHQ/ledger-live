import React from "react";
import {
  Box,
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Spot,
} from "@ledgerhq/lumen-ui-rnative";
import { Coins, Infinite } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { ServiceEntryPointId } from "../../types";
import type { ServicesEntryPointsViewProps } from "./ServicesEntryPointsView.types";

const ICONS = {
  perps: Infinite,
  borrow: Coins,
} as const satisfies Record<ServiceEntryPointId, unknown>;

type ServiceCardProps = Readonly<{
  service: ServiceEntryPointId;
  onOpenService: (service: ServiceEntryPointId) => void;
}>;

function ServiceCard({ service, onOpenService }: ServiceCardProps) {
  const { t } = useTranslation();

  function handlePress() {
    onOpenService(service);
  }

  return (
    <Card lx={{ flex: 1 }} onPress={handlePress}>
      <CardHeader>
        <CardLeading lx={{ flex: 0, flexDirection: "column", alignItems: "flex-start", gap: "s8" }}>
          <Spot icon={ICONS[service]} />
          <CardContent>
            <CardContentTitle>{t(`servicesEntryPoints.${service}.title`)}</CardContentTitle>
            <CardContentDescription>
              {t(`servicesEntryPoints.${service}.description`)}
            </CardContentDescription>
          </CardContent>
        </CardLeading>
      </CardHeader>
    </Card>
  );
}

export function ServicesEntryPointsView({ services, onOpenService }: ServicesEntryPointsViewProps) {
  if (services.length === 0) return null;

  return (
    <Box lx={{ flexDirection: "row", gap: "s12" }} testID="portfolio-services-entry-points">
      {services.map(function renderServiceCard(service) {
        return <ServiceCard key={service} service={service} onOpenService={onOpenService} />;
      })}
    </Box>
  );
}
