import React from "react";
import { ScrollView, type ViewStyle } from "react-native";
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
import { Coins, Infinite, Lightbulb } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTranslation } from "@shared/i18n";
import type { ServiceEntryPointId } from "../../types";
import type { ServicesEntryPointsViewProps } from "./ServicesEntryPointsView.types";

const ICONS = {
  perps: Infinite,
  borrow: Coins,
  predictions: Lightbulb,
} as const satisfies Record<ServiceEntryPointId, unknown>;

const CAROUSEL_MIN_CARDS = 3;
const CARD_WIDTH = 140;
const CARD_GAP = 12;
const PADDING_HORIZONTAL = 16;
// Cancels the portfolio's side padding so the carousel scrolls to the screen edges.
const MARGIN_HORIZONTAL = -16;

type ServiceCardProps = Readonly<{
  service: ServiceEntryPointId;
  style: ViewStyle;
  onOpenService: (service: ServiceEntryPointId) => void;
}>;

function ServiceCard({ service, style, onOpenService }: ServiceCardProps) {
  const { t } = useTranslation();

  function handlePress() {
    onOpenService(service);
  }

  return (
    <Card style={style} onPress={handlePress}>
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

  const isCarousel = services.length >= CAROUSEL_MIN_CARDS;
  const cards = services.map(function renderServiceCard(service) {
    return (
      <ServiceCard
        key={service}
        service={service}
        style={isCarousel ? { width: CARD_WIDTH } : { flex: 1 }}
        onOpenService={onOpenService}
      />
    );
  });

  if (!isCarousel) {
    return (
      <Box lx={{ flexDirection: "row", gap: "s12" }} testID="portfolio-services-entry-points">
        {cards}
      </Box>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID="portfolio-services-entry-points"
      contentContainerStyle={{ paddingHorizontal: PADDING_HORIZONTAL, gap: CARD_GAP }}
      style={{ marginHorizontal: MARGIN_HORIZONTAL }}
    >
      {cards}
    </ScrollView>
  );
}
