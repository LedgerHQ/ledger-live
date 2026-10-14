import React, { useCallback } from "react";
import { useTranslation } from "@shared/i18n";
import { useLocalizedUrl, useOpenLink } from "@shared/linking";
import { AppUnavailable } from "@shared/ui-app-unavailable";
import { useAppAvailability } from "../hooks/useAppAvailability";
import { urls } from "../urls";
import { ServiceUnavailable } from "./ServiceUnavailable";

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

  if (availability.status === "unavailable" && availability.reason === "geoBlocked") {
    return (
      <AppUnavailable
        title={t("geoBlocking.title")}
        description={t("geoBlocking.description")}
        action={{
          label: t("geoBlocking.learnMore"),
          onPress: openLearnMore,
          testID: "app-availability-learn-more",
        }}
        testID={testID}
      />
    );
  }

  if (availability.status === "unavailable" && availability.reason === "serviceUnavailable") {
    return <ServiceUnavailable testID={testID} />;
  }

  return <>{children}</>;
}
