import React, { useCallback } from "react";
import { useTranslation } from "@shared/i18n";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { AppUnavailable } from "@shared/ui-app-unavailable";
import { useAppAvailability } from "../hooks/useAppAvailability";
import type { AppAvailabilityStatus } from "../types";
import { urls } from "../urls";

const UNAVAILABLE_COPY = {
  geoBlocked: {
    titleKey: "geoBlocking.title",
    descriptionKey: "geoBlocking.description",
  },
  serviceUnavailable: {
    titleKey: "serviceUnavailable.title",
    descriptionKey: "serviceUnavailable.description",
  },
} as const satisfies Record<
  Extract<AppAvailabilityStatus, { status: "unavailable" }>["reason"],
  { titleKey: string; descriptionKey: string }
>;

export type AppAvailabilityProps = Readonly<{
  children: React.ReactNode;
  testID?: string;
}>;

export function AppAvailability({ children, testID }: AppAvailabilityProps): React.JSX.Element {
  const availability = useAppAvailability();
  const { t } = useTranslation();
  const openLink = useOpenLink();
  const learnMoreUrl = useLocalizedUrl(urls.geoBlockLearnMore);
  const openLearnMore = useCallback(() => {
    openLink(learnMoreUrl);
  }, [learnMoreUrl, openLink]);

  if (availability.status !== "unavailable") {
    return <>{children}</>;
  }

  const copy = UNAVAILABLE_COPY[availability.reason];
  const action =
    availability.reason === "geoBlocked"
      ? {
          label: t("geoBlocking.learnMore"),
          onPress: openLearnMore,
          testID: "app-availability-learn-more",
        }
      : undefined;

  return (
    <AppUnavailable
      title={t(copy.titleKey)}
      description={t(copy.descriptionKey)}
      action={action}
      testID={testID}
    />
  );
}
