import React from "react";
import {
  Card,
  CardContent,
  CardContentDescription,
  CardContentTitle,
  CardHeader,
  CardLeading,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Coins, Infinite } from "@ledgerhq/lumen-ui-react/symbols";
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

  function handleClick() {
    onOpenService(service);
  }

  return (
    <Card className="flex-1" onClick={handleClick}>
      <CardHeader>
        <CardLeading className="flex-none flex-col items-start gap-8">
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
    <div className="flex gap-12" data-testid="portfolio-services-entry-points">
      {services.map(function renderServiceCard(service) {
        return <ServiceCard key={service} service={service} onOpenService={onOpenService} />;
      })}
    </div>
  );
}
