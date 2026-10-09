import React from "react";
import { AppUnavailable } from "@shared/ui-app-unavailable";
import { useAppAvailability } from "../hooks/useAppAvailability";

export type AppAvailabilityProps = Readonly<{
  children: React.ReactNode;
  title: string;
  description: string;
  testID?: string;
}>;

export function AppAvailability({
  children,
  title,
  description,
  testID,
}: AppAvailabilityProps): React.JSX.Element {
  const availability = useAppAvailability();

  if (availability.status === "unavailable") {
    return <AppUnavailable title={title} description={description} testID={testID} />;
  }

  return <>{children}</>;
}
